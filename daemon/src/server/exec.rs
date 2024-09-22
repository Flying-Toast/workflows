use super::types::*;
use std::{collections::HashMap, sync::Arc};
use zbus::{zvariant, Connection};

/// Execution runtime error
#[derive(Debug, thiserror::Error, serde::Serialize)]
pub enum Error {
    #[error("variable `{0:?}` doesn't exist")]
    NoSuchVar(VarName),
    #[error("DBus error")]
    DBus(
        #[from]
        #[serde(skip_serializing)]
        zbus::Error,
    ),
    #[error("string -> num conversion failed")]
    StringToNum(Arc<str>),
    #[error("tried to store a DBus output with unsupported signature {0} in a variable")]
    UnsupportedDBusType(zvariant::OwnedSignature),
    #[error(
        "workflow expected {workflow_requested} output fields but dbus returned {dbus_returned}"
    )]
    DBusOutputCountMismatch {
        workflow_requested: usize,
        dbus_returned: usize,
    },
    #[error("expected literal value but got variable `{var}`")]
    VarLitCast { var: VarName },
    #[error("expected variable but got literal value {lit}")]
    ExpectedVar { lit: Lit },
    #[error("invalid DBus type signature `{0}`")]
    DBusSig(Arc<str>),
}

pub type Result<T> = std::result::Result<T, Error>;

struct Context {
    vars: HashMap<VarName, Lit>,
    session_conn: Connection,
}

impl std::fmt::Debug for Context {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("Context")
            .field("vars", &self.vars)
            .field("session_conn", &())
            .finish()
    }
}

impl Context {
    fn get_var(&self, name: VarName) -> Result<Lit> {
        self.vars.get(&name).ok_or(Error::NoSuchVar(name)).cloned()
    }

    fn resolve_expr(&self, exp: Expr) -> Result<Lit> {
        match exp {
            Expr::Var(varname) => self.get_var(varname),
            Expr::Lit(value) => Ok(value),
        }
    }

    async fn exec_block(&mut self, block: &Block) -> Result<()> {
        match block {
            Block::SetVar { var, val } => {
                self.vars
                    .insert(var.varname()?, self.resolve_expr(val.clone())?);
            }

            Block::DBusMethod {
                bus_name,
                object_path,
                interface,
                method,
                inputs,
                outputs,
            } => {
                let bus_name = bus_name.str()?;
                let object_path = object_path.str()?;
                let interface = interface.str()?;

                let proxy =
                    zbus::Proxy::new(&self.session_conn, &*bus_name, &*object_path, &*interface)
                        .await?;

                let mut args = zvariant::StructureBuilder::new();

                for i in inputs.iter() {
                    args.push_value(self.dbus_expr_to_value(i)?);
                }

                let ret: zvariant::OwnedStructure =
                    proxy.call(method.str()?.as_ref(), &args.build()).await?;
                let ret = ret.0;

                if outputs.len() != ret.fields().len() {
                    return Err(Error::DBusOutputCountMismatch {
                        workflow_requested: outputs.len(),
                        dbus_returned: ret.fields().len(),
                    });
                }

                for (val, var) in ret.into_fields().into_iter().zip(outputs) {
                    match var {
                        Some(var) => {
                            self.vars.insert(var.varname()?, val.try_into()?);
                        }
                        None => {}
                    }
                }
            }
        }

        Ok(())
    }

    fn dbus_expr_to_value(&self, exp: &DBusTypedExpr) -> Result<zvariant::Value> {
        let val = self.resolve_expr(exp.expr())?;

        let sig = exp.sig().str()?;
        Ok(match &*sig {
            "y" => (val.num()? as u8).into(),
            "b" => val.bool()?.into(),
            "n" => (val.num()? as i16).into(),
            "q" => (val.num()? as u16).into(),
            "i" => (val.num()? as i32).into(),
            "u" => (val.num()? as u32).into(),
            "x" => (val.num()? as i64).into(),
            "t" => (val.num()? as u64).into(),
            "d" => val.num()?.into(),
            "s" => zvariant::Str::from(val.str()?).into(),
            _ => return Err(Error::DBusSig(sig)),
        })
    }
}

pub async fn run_workflow(workflow: &Workflow, session_conn: Connection) {
    let mut ctx = Context {
        session_conn,
        vars: HashMap::new(),
    };

    for block in workflow.blocks() {
        if let Err(err) = ctx.exec_block(block).await {
            println!("TODO: save this to a JSON log so the app frontend can parse it and display it as e.g. a red outline around the block");
            println!("Error executing block: {err:?}");
            break;
        }
    }

    dbg!(ctx);
}
