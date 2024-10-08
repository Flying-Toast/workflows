import Adw from "gi://Adw";
import GObject from "gi://GObject";
import Gtk from "gi://Gtk?version=4.0";
import Template from "./block_selector_item.blp";
import { BlockInfoDialog } from "./block_info_dialog.js";
import { BlockSchema } from "../schema.js";

export class BlockSelectorItem extends Adw.Bin {
	private _titleLabel!: Gtk.Label;
	#schema: BlockSchema | null = null;

	static {
		GObject.registerClass({
			GTypeName: "WfBlockSelectorItem",
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
