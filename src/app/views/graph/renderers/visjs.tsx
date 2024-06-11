import { createRef, h } from 'preact';
import { GraphRenderer, GraphRendererProps } from ".";
import { Data, Network, Options } from "vis-network";
import { DataSet } from "vis-data";
import { ModelEdge, ModelNode } from "../../../../lib/builders/model";
import { BundleEdge, BundleNode } from "../../../../lib/builders/bundle";
import styles from './visjs.module.css';

/** Implements a renderer for VisJS-like graph */
abstract class VisJSRenderer<NodeLabel, EdgeLabel> extends GraphRenderer<NodeLabel, EdgeLabel> {
    async toBlob([width, height]: [number, number], type?: string, quality?: number): Promise<Blob> {
        const network = this.network;
        if (!network) {
            return Promise.reject('no network');
        }

        const dataset = this.dataset;
        if (!dataset) {
            return Promise.reject('no dataset');
        }

        return dataset.drawNetworkClone(network, width, height, type, quality);
    }

    protected abstract addNode(dataset: Dataset, id: number, node: NodeLabel): void;
    protected abstract addEdge(dataset: Dataset, from: number, to: number, edge: EdgeLabel): void;

    protected options(): Options {
        return {};
    }

    private network: Network | null = null;
    private dataset: Dataset | null = null;

    private createNetwork() {
        if (this.network || !this.container.current) {
            return;
        }

        const { graph, width, height } = this.props;

        // create a dataset from the graph
        const dataset = new Dataset();
        graph.getNodes().forEach(([id, node]) => {
            this.addNode(dataset, id, node);
        })
        graph.getEdges().forEach(([from, to, edge]) => {
            this.addEdge(dataset, from, to, edge);
        })

        const options = this.options();
        options.autoResize = false;

        const network = new Network(this.container.current!, dataset.toData(), options);
        network.setSize(`${width}px`, `${height}px`);
        network.redraw();

        this.network = network;
        this.dataset = dataset;
    }

    private destroyNetwork() {
        this.dataset = null;

        if (!this.network) { return; }
        this.network.destroy();
        this.network = null;
    }

    componentDidMount(): void {
        this.createNetwork();
    }
    componentDidUpdate(previousProps: GraphRendererProps<NodeLabel, EdgeLabel>): void {
        const { width, height, graph } = this.props;

        // if we got a new graph, re-create the network!
        if (previousProps.graph != graph) {
            this.destroyNetwork();
            this.createNetwork();
            return; // automatically resized properly
        }

        if (previousProps.width === width && previousProps.height !== height) {
            return; // size didn't change => no need to do anything
        }

        const network = this.network!;
        network.setSize(`${width}px`, `${height}px`);
        network.redraw();
    }

    private container = createRef<HTMLDivElement>()
    render() {
        const { width, height } = this.props;
        return <div ref={this.container} style={{width, height}} className={styles.container}></div>;
    }
}

export class VisJsBundleRenderer extends VisJSRenderer<BundleNode, BundleEdge> {
    options() {
        return {
            layout: {
                hierarchical: {
                    direction: 'UD',
                    sortMethod: 'directed',
                    shakeTowards: 'roots',
                },
            },
            physics: {
                hierarchicalRepulsion: {
                    avoidOverlap: 10,
                },
            },
        };
    }

    protected addNode(dataset: Dataset, id: number, node: BundleNode): void {
        if (node.type === 'bundle') {
            dataset.addNode({ id, label: "Bundle\n" + node.bundle.path().name, level: node.level });
            return;
        }
        if (node.type === 'field') {
            dataset.addNode({ id, label: node.field.path().name, color: 'orange', level: node.level });
            return;
        }
        throw new Error('never reached');
    }
    protected addEdge(dataset: Dataset, from: number, to: number, edge: BundleEdge): void {
        if (edge.type === 'child_bundle') {
            dataset.addEdge({ from, to, arrows: 'to' })
            return;
        }
        if (edge.type === 'field') {
            dataset.addEdge({ from, to, arrows: 'to' })
            return;
        }
        throw new Error('never reached')
    }
}


export class VisJSModelRenderer extends VisJSRenderer<ModelNode, ModelEdge> {
    protected options() {
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

    protected addNode(dataset: Dataset, id: number, node: ModelNode): void {
        const { ns } = this.props;
        if (node.type === 'field') {
            dataset.addNode({
                id,
                label: node.field.path().name,

                shape: 'box',
                color: 'orange',
            });
            return;
        }
        if (node.type === 'class' && node.bundles.size === 0) {
            dataset.addNode({
                id,
                label: ns.apply(node.clz),
            });
            return;
        }
        if (node.type === 'class' && node.bundles.size > 0) {
            const array_names = Array.from(node.bundles).map((bundle) => "Bundle " + bundle.path().name).join("\n\n");
            const label = ns.apply(node.clz) + "\n\n" + array_names;

            dataset.addNode({
                id,
                label,
            });
            return;
        }
        throw new Error('never reached');
    }
    protected addEdge(dataset: Dataset, from: number, to: number, edge: ModelEdge): void {
        const { ns } = this.props;
        if (edge.type === 'data') {
            dataset.addEdge({
                from, to,
                arrows: 'to',

                label: ns.apply(edge.field.path().datatype_property),
            });
            return;
        }
        if (edge.type === 'property') {
            dataset.addEdge({
                from, to,
                arrows: 'to',

                label: ns.apply(edge.property),
            })
            return;
        }
        throw new Error('never reached')
    }
}

type VisNode<T extends string | number> = {
    id?: T,
    shape?: Shape,
    level?: number,
    x?: number,
    y?: number,
} & VisCommon;

type Shape = 'ellipse' | 'circle' | 'database' | 'box' | 'text' | 'image' | 'circularImage' | 'diamond' | 'dot' | 'star' | 'triangle' | 'triangleDown' | 'hexagon' | 'square' | 'icon';

type VisEdge<T extends string | number> = {
    from: T
    to: T
    arrows?: "to"
    id?: never // needed by dataset api
} & VisCommon;

type VisCommon = {
    label?: string;
    color?: string;
    font?: string;
}

class Dataset {
    private nodes = new DataSet<VisNode<string | number>>();
    private edges = new DataSet<VisEdge<string | number>>();

    addNode(node: VisNode<string | number>): string {
        const id = this.nodes.add(node)[0] as string;
        return id;
    }
    addEdge(edge: VisEdge<string | number>): string {
        return this.edges.add(edge)[0] as string
    }
    toData(): Data {
        return { nodes: this.nodes, edges: this.edges } as unknown as Data;
    }

    /** drawNetworkClone draws a clone of this dataset from the given network */
    async drawNetworkClone(network: Network, width: number, height: number, type?: string, quality?: number): Promise<Blob> {
        // get the original canvas size
        const orgCanvas = (await draw(network)).canvas;

        // copy nodes, edges, positions
        const nodes = this.nodes.get();
        const edges = this.edges.get();
        const positions = network.getPositions();

        // create a new set of nodes
        const nodeSet = new DataSet<VisNode<string | number>>();
        nodes.forEach(node => {
            const { x, y } = positions[node.id];
            nodeSet.add({...node, x, y})
        })
        
        // create a new set of edges
        const edgeSet = new DataSet<VisEdge<string>>();
        edges.forEach(edge => edgeSet.add(edge))

        // create a temporary container with the original size
        const container = document.createElement('div');
        container.style.boxSizing = 'border-box';
        container.style.width = `${orgCanvas.width}px`;
        container.style.height = `${orgCanvas.height}px`;
        document.body.append(container);

        // create a clone of the network
        const networkClone = new Network(container, { nodes: nodeSet, edges: edgeSet } as unknown as any, {
            autoResize: false,
            physics: false,
            layout: {
                randomSeed: network.getSeed(),
            },
        });

        // reset the size and fit all the nodes on it
        networkClone.setSize(`${width}px`, `${height}px`)
        networkClone.moveTo({ scale: Math.max(width / orgCanvas.width, height / orgCanvas.height) })
        networkClone.fit({ animation: false });

        // export the network as a png
        return new Promise<Blob>(async (rs, rj) => {
            const canvas = (await draw(networkClone)).canvas;
            canvas.toBlob((blob) => {
                if (!blob) {
                    rj('no blob');
                    return;
                }
                rs(blob)
            }, type, quality);
        }).finally(() => {
            networkClone.destroy()
            document.body.removeChild(container)
        })

    }
}

async function draw(network: Network): Promise<CanvasRenderingContext2D> {
    return new Promise((rs) => {
        network.once('afterDrawing', (ctx) => rs(ctx))
        network.redraw()
    })
}