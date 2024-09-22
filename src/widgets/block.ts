import Adw from "gi://Adw";
import Gtk from "gi://Gtk?version=4.0";
import Gio from "gi://Gio";
import GObject from "gi://GObject";
import Template from "./block.blp";
import { ParamRow } from "./param_row.js";
import { BlockSchema } from "../schema.js";
import { BlockInfoDialog } from "./block_info_dialog.js";

export class Block extends Adw.Bin {
	private _titleLabel!: Gtk.Label;
	private _listbox!: Gtk.ListBox;
	#schema: BlockSchema;

	static {
		GObject.registerClass({
			GTypeName: "WfBlock",
			Template: Template,
			InternalChildren: [
				"titleLabel",
				"listbox",
			],
		}, this);
	}

	constructor(schema: BlockSchema) {
		super();
		this.#schema = schema;
		this._titleLabel.label = schema.label;

		const actions = new Gio.SimpleActionGroup();
		this.insert_action_group("block", actions);

		actions.add_action_entries([
			{
				name: "info-dialog",
				activate: (_act: Gio.SimpleAction) => {
					const dialog = new BlockInfoDialog(this.#schema);
					dialog.present(this);
				},
			} as unknown as Gio.ActionEntry,
		]);

		for (const param of schema.params) {
			const row = new ParamRow(param);
			this._listbox.append(row);
		}
	}
}
