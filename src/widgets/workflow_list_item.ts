import Adw from "gi://Adw";
import GObject from "gi://GObject";
import Gtk from "gi://Gtk?version=4.0";
import Pango from "gi://Pango";
import Template from "./workflow_list_item.blp";
import { Workflow } from "../workflow.js";

export class WorkflowListItem extends Adw.Bin {
	private _label!: Gtk.EditableLabel;
	#workflow: Workflow | null = null;
	#workflowBindings: GObject.Binding[] = [];

	static {
		GObject.registerClass({
			GTypeName: "WfWorkflowListItem",
			Template: Template,
			InternalChildren: [
				"label",
			],
		}, this);
	}

	set workflow(workflow: Workflow) {
		this.#workflow = workflow;
		this._label.text = workflow.name;

		for (const binding of this.#workflowBindings) {
			binding.unbind();
		}
		this.#workflowBindings = [];

		const innerLabel = this._label.get_first_child()?.get_first_child();
		if (innerLabel instanceof Gtk.Label) {
			innerLabel.ellipsize = Pango.EllipsizeMode.END;
		} else {
			console.error("EditableLabel monkey patch failed :(");
		}

		this.#workflowBindings.push(
			this.#workflow.bind_property(
				"name",
				this._label,
				"tooltip-text",
				GObject.BindingFlags.SYNC_CREATE,
			)
		);

		this.#workflowBindings.push(
			this.#workflow.bind_property(
				"name",
				this._label,
				"text",
				GObject.BindingFlags.SYNC_CREATE,
			)
		);

		this._label.connect(
			"notify::editing",
			(lbl: Gtk.EditableLabel) => {
				if (!lbl.editing) {
					lbl.editable = false;
					this.#workflow!.name = lbl.text;
				}
			}
		);
	}

	startNameEdit() {
		this._label.editable = true;
		this._label.start_editing();
	}
}
