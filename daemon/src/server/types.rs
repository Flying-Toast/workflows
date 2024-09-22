use super::exec::{Error, Result};
use std::sync::Arc;
use zbus::zvariant::Value as ZValue;

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct Workflow {
    trigger: Trigger,
    blocks: Vec<Block>,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub enum Trigger {
    None,
    #[serde(rename_all = "camelCase")]
    EveryNSeconds {
        n: Expr,
        run_at_start: Expr,
    },
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub enum Block {
    #[serde(rename_all = "camelCase")]
    DBusMethod {
        bus_name: Expr,
        object_path: Expr,
        interface: Expr,
        method: Expr,
        inputs: Vec<DBusTypedExpr>,
        outputs: Vec<Option<Expr>>,
    },
    SetVar {
        var: Expr,
        val: Expr,
    },
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct DBusTypedExpr {
    sig: Expr,
    expr: Expr,
}

/// Cheaply clonable
#[derive(serde::Serialize, serde::Deserialize, Hash, Eq, PartialEq, Clone)]
pub struct VarName(pub Arc<str>);

/// Cheaply clonable
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub enum Expr {
    Var(VarName),
    #[serde(untagged)]
    Lit(Lit),
}

/// Cheaply clonable
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub enum Lit {
    Str(Arc<str>),
    Num(f64),
    Bool(bool),
}

impl Expr {
    fn lit(&self) -> Result<Lit> {
        match self {
            Expr::Var(name) => Err(Error::VarLitCast { var: name.clone() }),
            Expr::Lit(lit) => Ok(lit.clone()),
        }
    }

    pub fn varname(&self) -> Result<VarName> {
        match self {
            Expr::Var(name) => Ok(name.clone()),
            Expr::Lit(lit) => Err(Error::ExpectedVar { lit: lit.clone() }),
        }
    }

    pub fn str(&self) -> Result<Arc<str>> {
        self.lit()?.str()
    }

    pub fn num(&self) -> Result<f64> {
        self.lit()?.num()
    }

    pub fn bool(&self) -> Result<bool> {
        self.lit()?.bool()
    }
}

impl Lit {
    pub fn str(&self) -> Result<Arc<str>> {
        Ok(match self {
            Lit::Str(x) => x.clone(),
            Lit::Num(x) => x.to_string().into(),
            Lit::Bool(x) => x.to_string().into(),
        })
    }

    pub fn num(&self) -> Result<f64> {
        Ok(match self {
            Lit::Str(x) => x.parse().or(Err(Error::StringToNum(x.clone())))?,
            Lit::Num(x) => *x,
            Lit::Bool(x) => {
                if *x {
                    1.
                } else {
                    1.
                }
            }
        })
    }

    pub fn bool(&self) -> Result<bool> {
        Ok(match self {
            Lit::Str(x) => !x.is_empty(),
            Lit::Num(x) => *x != 0. && !x.is_nan(),
            Lit::Bool(x) => *x,
        })
    }
}

impl Workflow {
    pub fn trigger(&self) -> &Trigger {
        &self.trigger
    }

    pub fn blocks(&self) -> &[Block] {
        &self.blocks
    }
}

impl std::fmt::Debug for VarName {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{:?}", &self.0)
    }
}

impl std::fmt::Display for VarName {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{:?}", &self.0)
    }
}

impl std::fmt::Display for Lit {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Lit::Str(s) => f.write_str(&*s),
            Lit::Num(n) => write!(f, "{n}"),
            Lit::Bool(b) => write!(f, "{b}"),
        }
    }
}

impl DBusTypedExpr {
    pub fn sig(&self) -> Expr {
        self.sig.clone()
    }

    pub fn expr(&self) -> Expr {
        self.expr.clone()
    }
}

impl TryFrom<ZValue<'_>> for Lit {
    type Error = Error;

    fn try_from(z: ZValue) -> std::result::Result<Self, Self::Error> {
        let err = |z: ZValue| {
            Err(Error::UnsupportedDBusType(
                z.value_signature().into_owned().into(),
            ))
        };

        Ok(match z {
            ZValue::U8(n) => Self::Num(n as f64),
            ZValue::I16(n) => Self::Num(n as f64),
            ZValue::U16(n) => Self::Num(n as f64),
            ZValue::I32(n) => Self::Num(n as f64),
            ZValue::U32(n) => Self::Num(n as f64),
            ZValue::I64(n) => Self::Num(n as f64),
            ZValue::U64(n) => Self::Num(n as f64),
            ZValue::F64(n) => Self::Num(n as f64),
            ZValue::Bool(b) => Self::Bool(b),
            // TODO: this allocation shouldn't be necessary
            ZValue::Str(s) => Self::Str(s.as_str().into()),
            ZValue::Value(v) => (*v).try_into()?,
            ZValue::Signature(_) => return err(z),
            ZValue::ObjectPath(_) => return err(z),
            ZValue::Array(_) => return err(z),
            ZValue::Dict(_) => return err(z),
            ZValue::Structure(_) => return err(z),
            ZValue::Fd(_) => return err(z),
        })
    }
}
