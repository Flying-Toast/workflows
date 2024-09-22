use super::ClientCommand;
use zbus::blocking::Connection;

#[zbus::proxy(
    gen_async = false,
    gen_blocking = true,
    interface = "io.github.flying_toast.Workflows.Daemon",
    default_service = "io.github.flying_toast.Workflows.Daemon",
    default_path = "/io/github/flying_toast/Workflows/Daemon"
)]
trait DaemonService {
    fn load(&self, uuid: &str) -> zbus::Result<()>;
    fn run_now(&self, uuid: &str) -> zbus::Result<()>;
}

pub fn process(cmd: ClientCommand) -> zbus::Result<()> {
    let conn = Connection::session()?;
    let proxy = DaemonServiceProxy::new(&conn)?;

    match cmd {
        ClientCommand::Load { uuid } => proxy.load(&uuid),
        ClientCommand::RunNow { uuid } => proxy.run_now(&uuid),
    }
}
