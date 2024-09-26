import Adw from "gi://Adw";
import GObject from "gi://GObject";
import Gtk from "gi://Gtk?version=4.0";
import Template from "./selector_item.blp";
import { BlockInfoDialog } from "./block_info_dialog.js";
import { BlockSchema } from "../schema.js";

export class SelectorItem extends Adw.Bin {
	private _titleLabel!: Gtk.Label;
	#schema: BlockSchema | null = null;

	static {
		GObject.registerClass({
			GTypeName: "WfSelectorItem",
			Template: Template,
			InternalChildren: [
				"titleLabel",
			],
		}, this);
	}

	set schema(schema: BlockSchema) {
		this.#schema = schema;
		this._titleLabel.label = schema.label;
	}

	showInfoDialog() {
		new BlockInfoDialog(this.#schema!).present(this);
	}
}
