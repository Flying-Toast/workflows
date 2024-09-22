import Gio from "gi://Gio";
import { WfApplication } from "./application.js";

export function main(argv: string[]): Promise<number> {
	const app = new WfApplication();
	return app.runAsync(argv);
}

Gio._promisify(Gio.File.prototype, "enumerate_children_async", "enumerate_children_finish");
Gio._promisify(Gio.File.prototype, "load_contents_async", "load_contents_finish");
Gio._promisify(Gio.FileEnumerator.prototype, "next_files_async", "next_files_finish");
