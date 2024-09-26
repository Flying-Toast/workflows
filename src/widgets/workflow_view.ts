import Adw from "gi://Adw";
import GObject from "gi://GObject";
import Gtk from "gi://Gtk?version=4.0";
import Gio from "gi://Gio";
import Template from "./workflow_view.blp";
import { Block } from "./block.js";
import { BlockSchema, allBlockSchemas } from "../schema.js";
import { BlockSelectorDialog } from "./block_selector_dialog.js";
import { Workflow } from "../workflow.js";

export class WorkflowView extends Adw.NavigationPage {
	private _unselectedStatusPage!: Adw.StatusPage;
	private _blocksFlowbox!: Gtk.FlowBox;
	#workflow: Workflow | null = null;
	#workflowNameBinding: GObject.Binding | null = null;

	static {
		GObject.registerClass({
			GTypeName: "WfWorkflowView",
			Template: Template,
			InternalChildren: [
				"unselectedStatusPage",
				"blocksFlowbox",
			],
		}, this);
	}

	get workflow(): Workflow | null {
		return this.#workflow;
	}

	set workflow(workflow: Workflow) {
		this.#workflow = workflow;
		if (this.#workflowNameBinding != null) {
			this.#workflowNameBinding.unbind();
		}
		this.#workflowNameBinding = workflow.bind_property(
			"name",
			this,
			"title",
			GObject.BindingFlags.SYNC_CREATE
		);
		this._unselectedStatusPage.visible = false;
	}

	openSelectorAtStart() {
		this.#openSelectorAtIndex(0);
	}

	#insertBlock(index: number, schema: BlockSchema) {
		const box = new Gtk.Box({orientation: Gtk.Orientation.VERTICAL});
		box.append(new Block(schema));

		const btn = this.#makePlusButton();
		box.append(btn);

		const fbChild = new Gtk.FlowBoxChild({
			focusable: false,
			child: box,
			css_classes: ["no-vpad"],
		});

		btn.connect("clicked", (_btn) => {
			this.#openSelectorAtIndex(fbChild.get_index() + 1);
		});

		this._blocksFlowbox.insert(fbChild, index);
	}

	#openSelectorAtIndex(index: number) {
		allBlockSchemas().then((items) => {
			const dlg = new BlockSelectorDialog(items);
			dlg.connect(
				"block-selected",
				(_selector: BlockSelectorDialog, selectedSchema: BlockSchema) => {
					this.#insertBlock(index, selectedSchema);
				},
			)
			dlg.present(this);
		});
	}

	#makePlusButton(): Gtk.Button {
		return new Gtk.Button({
			css_classes: ["circular"],
			icon_name: "list-add-symbolic",
			tooltip_text: _!("Insert Block Here"),
			halign: Gtk.Align.CENTER,
			margin_top: 8,
			margin_bottom: 8,
		});
	}
}
