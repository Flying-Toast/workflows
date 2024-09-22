use super::load::read_workflow;
use super::types::Workflow;
use std::process;
use tokio::sync::mpsc;

#[derive(Debug)]
pub enum Message {
    Load(String, Workflow),
    RunNow(Workflow),
}

#[derive(Debug)]
struct Service {
    tx: mpsc::UnboundedSender<Message>,
}

impl Service {
    fn new(tx: mpsc::UnboundedSender<Message>) -> Self {
        Self { tx }
    }
}

#[zbus::interface(spawn = false, name = "io.github.flying_toast.Workflows.Daemon")]
impl Service {
    async fn load(&self, uuid: String) {
        match read_workflow(&uuid).await {
            // TODO: replace all console logging with writing to a json log
            // that the app frontend can parse to display nicely
            Err(e) => eprintln!("{e:?}"),
            Ok(workflow) => self.tx.send(Message::Load(uuid, workflow)).unwrap(),
        }
    }

    async fn run_now(&self, uuid: String) {
        match read_workflow(&uuid).await {
            // TODO: replace all console logging with writing to a json log
            // that the app frontend can parse to display nicely
            Err(e) => eprintln!("{e:?}"),
            Ok(workflow) => self.tx.send(Message::RunNow(workflow)).unwrap(),
        }
    }
}

pub async fn start() -> (zbus::Connection, mpsc::UnboundedReceiver<Message>) {
    let (tx, rx) = mpsc::unbounded_channel();

    let err = zbus::connection::Builder::session()
        .unwrap()
        .name("io.github.flying_toast.Workflows.Daemon")
        .unwrap()
        .serve_at("/io/github/flying_toast/Workflows/Daemon", Service::new(tx))
        .unwrap()
        .build()
        .await;

    let conn = match err {
        Err(zbus::Error::NameTaken) => {
            eprintln!("Server already running");
            process::exit(1);
        }
        _ => err.unwrap(),
    };

    (conn, rx)
}
