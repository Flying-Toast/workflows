import GObject from "gi://GObject";

export class Workflow extends GObject.Object {
	private _name: string;

	static {
		GObject.registerClass({
			GTypeName: "WfWorkflow",
			Properties: {
				"name": GObject.ParamSpec.string(
					"name",
					"",
					"",
					GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
					"WTF?!?!",
				),
			},
		}, this);
	}

	constructor(name: string) {
		super();
		this._name = name;
	}

	get name(): string {
		return this._name;
	}

	set name(name: string) {
		this._name = name;
		this.notify("name");
	}
}
