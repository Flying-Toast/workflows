use super::types::Workflow;
use std::{
    env,
    path::{Path, PathBuf},
    sync::OnceLock,
};
use tokio::fs;

/// Error retrieving a [`Workflow`] from disk.
#[derive(Debug, thiserror::Error)]
pub enum Error {
    #[error("failed to read workflow file")]
    ReadWorkflow(#[from] std::io::Error),
    #[error("failed to parse workflow from JSON")]
    ParseWorkflow(#[from] serde_json::Error),
    #[error("bad filename `{0:?}` for workflow")]
    WorkflowFilename(PathBuf),
}

type Result<T> = std::result::Result<T, Error>;

pub async fn read_workflow(uuid: &str) -> Result<Workflow> {
    let mut path = workflows_dir().to_owned();
    path.push(format!("{uuid}.json"));
    let string = fs::read_to_string(&path).await?;
    Ok(serde_json::from_str(&string)?)
}

pub fn blocking_read_all_workflows() -> impl Iterator<Item = Result<(String, Workflow)>> {
    std::fs::read_dir(workflows_dir()).unwrap().map(|ent| {
        let path = ent?.path();
        let string = std::fs::read_to_string(&path)?;
        let uuid = match path.to_str().and_then(|x| x.strip_suffix(".json")) {
            Some(uuid) => uuid,
            None => return Err(Error::WorkflowFilename(path)),
        };
        Ok((uuid.to_owned(), serde_json::from_str(&string)?))
    })
}

fn workflows_dir() -> &'static Path {
    static PATH: OnceLock<PathBuf> = OnceLock::new();
    PATH.get_or_init(|| {
        let mut data_dir: PathBuf = env::var_os("XDG_DATA_HOME")
            .expect("XDG_DATA_HOME not set")
            .into();
        data_dir.push("workflows");
        data_dir
    })
}
