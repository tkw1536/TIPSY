import { h, Component, Fragment } from 'preact';
import type { ViewProps } from "../../viewer";

import { Bundle, NodeLike } from "../../../lib/pathtree";

import VisJSGraph, { Dataset } from ".";

export default class ModelGraphView extends Component<ViewProps> {
    render() {
        const { pathbuilderVersion, namespaceVersion, selectionVersion } = this.props;
        return <ModelGraph key={`${pathbuilderVersion}-${namespaceVersion}-${selectionVersion}`} {...this.props} />
    }
}

class ModelGraph extends VisJSGraph<ViewProps> {
    options() {
        return {
            physics: {
                barnesHut: {
                    springConstant: 0,
                    avoidOverlap: 10,
                    damping: 0.09,
                },
            },
            edges: {
                smooth: {
                    enabled: true,
                    type: "continuous",
                    forceDirection: "none",
                    roundness: 0.6,
                },
            },
        }
    }
    prepare(dataset: Dataset): void {
        const { tree: { mainBundles } } = this.props;

        const tracker = new ArrayTracker<string>((left, right) => left === right);

        mainBundles.forEach(b => {
            this.addBundle(dataset, tracker, b, 0);
        })

    }
    private addBundle(dataset: Dataset, tracker: ArrayTracker<string>, bundle: Bundle, level: number): boolean {
        const { selection } = this.props;

        // add the node for this bundle
        const includeSelf = selection.includes(bundle.path().id);

        // add all the child bundles
        bundle.childBundles.forEach(cb => {
            this.addBundle(dataset, tracker, cb, level + 1);
        });

        // add all the child fields
        bundle.childFields.forEach(cf => {
            const includeField = selection.includes(cf.path().id);
            if (!includeField) return;

            this.addPath(dataset, tracker, cf);
        })

        return includeSelf
    }

    private addPath(dataset: Dataset, tracker: ArrayTracker<string>, node: NodeLike) {
        // get the actual path to add
        const path = node.path();
        if (!path) return;

        // find the path to include for this element
        let ownPath = path.path_array;

        // remove the parent path (if we've already added it)
        const parent = node.parent();
        const displayParent = this.props.selection.includes(parent?.path()?.id ?? '');
        if (parent && displayParent) {
            const length = parent.path().path_array.length;
            if (length >= 0 && length % 2 == 0) {
                ownPath = ownPath.slice(length);
            }
        }

        // make a function to add a node
        const { ns } = this.props;
        const addNodeIfNotExists = (i: number) => {
            const node = { id: ownPath[i], label: ns.apply(ownPath[i]) }
            if (tracker.add([node.id])) {
                dataset.addNode(node);
            }
            return node.id;
        }

        // add all the parts of the node
        let prev = addNodeIfNotExists(0)
        for (let i = 1; i + 1 < ownPath.length; i += 2) {
            const next = addNodeIfNotExists(i + 1);
            if (tracker.add([prev, next, ownPath[i]])) {
                dataset.addEdge({ from: prev, to: next, arrows: 'to', label: ns.apply(ownPath[i]) });
            }
            prev = next;
        }

        // check if we have a datatype property 
        if (path.datatype_property == "") {
            return;
        }

        // add the datatype property (if any)
        const data = dataset.addNode({ label: path.name, shape: 'box', color: 'orange' });
        dataset.addEdge({ from: prev, to: data, label: ns.apply(path.datatype_property), arrows: 'to' });
    }
}

class ArrayTracker<T> {
    constructor(public equality: (left: T, right: T) => boolean) {
    }

    private seen: T[][] = [];

    /** add adds element unless it is already there */
    add(element: T[]) {
        if (this.has(element)) return false; // don't add it again!
        this.seen.push(element.slice(0)); // add it!
        return true;
    }

    /** has checks if element is there  */
    has(element: T[]) {
        return this.index(element) >= 0;
    }
    private index(element: T[]): number {
        for (let i = 0; i < this.seen.length; i++) {
            const candidate = this.seen[i];
            if (candidate.length !== element.length) {
                continue;
            }

            let ok = true;
            for (let j = 0; j < candidate.length; j++) {
                if (!this.equality(candidate[j], element[j])) {
                    ok = false;
                    break;
                }
            }

            if (ok) { return i; }
        }
        return -1;
    }
}