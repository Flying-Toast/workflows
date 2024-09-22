mod daemon;
mod dbus_service;
mod exec;
mod load;
mod types;

pub fn run() {
    let () = tokio::runtime::Builder::new_multi_thread()
        .enable_all()
        .build()
        .unwrap()
        .block_on(async {
            let (conn, mut rx) = dbus_service::start().await;
            let mut daemon = daemon::Daemon::new(conn);

            for i in load::blocking_read_all_workflows() {
                match i {
                    Err(err) => eprintln!("{err:?}"),
                    Ok((uuid, workflow)) => {
                        daemon.process_message(dbus_service::Message::Load(uuid, workflow));
                    }
                }
            }

            while let Some(msg) = rx.recv().await {
                daemon.process_message(msg);
            }

            panic!("DBus service died");
        });
}
