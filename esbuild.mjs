import { build } from "esbuild";
import { promisify } from "util";
import { exec } from "child_process";
import fs from "node:fs/promises";
const execp = promisify(exec);

const outdir = process.env.OUTPUT_DIR;
if (!outdir) {
	throw new Error("need OUTPUT_DIR var");
}
const entrypoint = process.env.ENTRY_POINT;
if (!entrypoint) {
	throw new Error("need ENTRY_POINT var");
}
const blpcmp = process.env.BLUEPRINT_COMPILER;
if (!blpcmp) {
	throw new Error("need BLUEPRINT_COMPILER var");
}

const blueprintPlugin = {
	name: "blueprint",
	setup(build) {
		build.onLoad({ filter: /\.blp$/ }, async (args) => {
			const path = await fs.mkdtemp("/tmp/compiled-blueprint") + "/cmp.ui";
			await execp(`${blpcmp} compile --output ${path} ${args.path}`);
			const content = await fs.readFile(path, { encoding: "utf8" });
			return {
				contents: content,
				loader: "text",
			}
		})
	},
};

await build({
	entryPoints: [entrypoint],
	outdir: outdir,
	bundle: true,
	target: "firefox115", // Since GJS 1.77.2
	format: "esm",
	external: ["gi://*", "resource://*", "gettext", "system", "cairo"],
	plugins: [blueprintPlugin],
});
