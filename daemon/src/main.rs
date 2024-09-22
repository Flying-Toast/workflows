mod client;
mod server;

use clap::{Parser, Subcommand};

#[derive(Debug, Parser)]
struct Cli {
    #[command(subcommand)]
    command: Command,
}

#[derive(Debug, Subcommand)]
enum Command {
    /// Utility commands for sending messages to the running server instance.
    #[command(subcommand)]
    Client(ClientCommand),
    /// Start the server instance (if not already running).
    Server,
}

#[derive(Debug, Subcommand)]
enum ClientCommand {
    /// Run a specific workflow right now, without affecting any of its other schedulings. The
    /// version that gets run is newly read from disk, but it doesn't actually `Load` it into the
    /// daemon.
    RunNow { uuid: String },
    /// If the given workflow's trigger requires scheduling, schedule it. If an instance of that
    /// workflow is already scheduled it will be killed first.
    Load { uuid: String },
}

fn main() {
    let cli = Cli::parse();

    match cli.command {
        Command::Server => server::run(),
        Command::Client(cmd) => match client::process(cmd) {
            Ok(_) => {}
            Err(e) => eprintln!("client error: {e:?}"),
        },
    }
}
