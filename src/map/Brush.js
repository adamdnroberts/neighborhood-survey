import { HoverWithRadius } from "./Hover";
import { bindAll } from "../utils";

export default class Brush extends HoverWithRadius {
    constructor(layer, radius, color) {
        super(layer, radius);

        this.color = color;
        this.locked = false;

        this.listeners = { colorend: [], colorfeature: [], mouseup: [] };

        bindAll(["onClick", "onTouchEnd"], this);
    }
    setColor(color) {
        this.color = parseInt(color);
    }
    startErasing() {
        this._previousColor = this.color;
        this.color = null;
        this.erasing = true;
    }
    stopErasing() {
        this.color = this._previousColor;
        this.erasing = false;
    }
    hoverOn(features) {
        this.hoveredFeatures = features;
        super.hoverOn(features);
    }
    colorFeatures() {
        if (this.locked && !this.erasing) {
            this._colorFeatures(
                feature =>
                    feature.state.color === null ||
                    feature.state.color === undefined
            );
        } else {
            this._colorFeatures(feature => feature.state.color !== this.color);
        }
    }
    _colorFeatures(filter) {
        let seenFeatures = new Set();
        for (let feature of this.hoveredFeatures) {
            if (filter(feature) && !feature.state.home) {
                if (!seenFeatures.has(feature.id)) {
                    seenFeatures.add(feature.id);
                    for (let listener of this.listeners.colorfeature) {
                        listener(feature, this.color);
                    }
                }
                this.layer.setFeatureState(feature.id, {
                    ...feature.state,
                    color: this.color,
                    hover: true
                });
                feature.state.color = this.color;
            } else {
                this.layer.setFeatureState(feature.id, {
                    ...feature.state,
                    hover: true
                });
            }
        }
        for (let listener of this.listeners.colorend) {
            listener();
        }
    }
    onClick() {
        this.colorFeatures();
    }
    onTouchEnd(e) {
        if (e.points && e.points.length <= 1) {
            this.colorFeatures();
        }
    }
    activate() {
        this.layer.map.getCanvas().classList.add("brush-tool");

        super.activate();

        this.layer.on("click", this.onClick);
        this.layer.map.on("touchend", this.onTouchEnd);
    }
    deactivate() {
        this.layer.map.getCanvas().classList.remove("brush-tool");

        super.deactivate();

        this.layer.off("click", this.onClick);
        this.layer.map.off("touchend", this.onTouchEnd);
    }
    on(event, listener) {
        this.listeners[event].push(listener);
    }
}
