use super::{
    dbus_service::Message,
    exec,
    types::{Trigger, Workflow},
};
use std::{collections::HashMap, time::Duration};
use tokio::{task::AbortHandle, time};
use zbus::Connection;

#[derive(Debug)]
pub struct Daemon {
    /// Workflows that are `scheduled` are tasks running infinite loops that .await their trigger
    /// condition and run the workflow.
    scheduled: HashMap<String, AbortHandle>,
    session_conn: Connection,
}

impl Daemon {
    pub fn new(session_conn: Connection) -> Self {
        Self {
            scheduled: HashMap::new(),
            session_conn,
        }
    }

    pub fn process_message(&mut self, msg: Message) {
        match msg {
            Message::Load(uuid, workflow) => self.load(uuid, workflow),
            Message::RunNow(workflow) => self.run_now(workflow),
        }
    }

    fn load(&mut self, uuid: String, workflow: Workflow) {
        if let Some(handle) = self.scheduled.remove(&uuid) {
            handle.abort();
        }

        match self.maybe_schedule(workflow) {
            Ok(Some(handle)) => {
                self.scheduled.insert(uuid, handle);
            }
            Ok(None) => {}
            Err(e) => eprintln!("Error scheduling: {e}"),
        }
    }

    fn run_now(&mut self, workflow: Workflow) {
        let conn = self.session_conn.clone();
        tokio::task::spawn(async move {
            exec::run_workflow(&workflow, conn).await;
        });
    }

    fn maybe_schedule(&self, workflow: Workflow) -> Result<Option<AbortHandle>, exec::Error> {
        let conn = self.session_conn.clone();
        Ok(Some(match workflow.trigger() {
            Trigger::None => return Ok(None),

            Trigger::EveryNSeconds { n, run_at_start } => {
                let run_at_start = run_at_start.bool()?;
                let n = n.num()?;
                tokio::spawn(async move {
                    loop {
                        let dur = Duration::from_secs(n as _);
                        if run_at_start {
                            exec::run_workflow(&workflow, conn.clone()).await;
                            time::sleep(dur).await;
                        } else {
                            time::sleep(dur).await;
                            exec::run_workflow(&workflow, conn.clone()).await;
                        }
                    }
                })
                .abort_handle()
            }
        }))
    }
}
