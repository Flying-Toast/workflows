import Adw from "gi://Adw";
import GObject from "gi://GObject";
import Gio from "gi://Gio";
import Gtk from "gi://Gtk?version=4.0";
import { WfWindow } from "./window.js";

export class WfApplication extends Adw.Application {
	#window: WfWindow | null = null;

	static {
		GObject.registerClass({
			GTypeName: "WfApplication",
		}, this);
	}

	constructor() {
		super({
			application_id: "io.github.flying_toast.Workflows",
			flags: Gio.ApplicationFlags.DEFAULT_FLAGS,
		});

		const quit_action = new Gio.SimpleAction({ name: "quit" });
		quit_action.connect("activate", () => {
			this.quit();
		});

		this.add_action(quit_action);
		this.set_accels_for_action("app.quit", ["<Control>q"]);

		const show_about_action = new Gio.SimpleAction({ name: "about" });
		show_about_action.connect("activate", () => {
			const aboutDialog = new Adw.AboutDialog({
				application_name: _!("Workflows"),
				application_icon: "io.github.flying_toast.Workflows",
				developer_name: "Flying-Toast",
				version: "0.1",
				developers: ["Flying-Toast"],
				copyright: "© 2023 Flying-Toast",
			});

			aboutDialog.present(this.active_window);
		});

		this.add_action(show_about_action);

		Gio._promisify(Gtk.UriLauncher.prototype, "launch", "launch_finish");
	}

	public vfunc_activate(): void {
		if (this.#window == null) {
			this.#window = new WfWindow({ application: this });
		}

		this.#window.present();
	}
}
