# About & Help

<!-- spellchecker:words SPARQL Exportfile -->

WissKI[^1] is a system that enables users to represent data about any kind of objects using a formal ontology in an an RDF/SPARQL database.
WissKI does not fix the ontology.
The exact data model can be specified using the so-called Pathbuilder.

A typical WissKI use case is recording of objects in a scientific university collection.
Here the ontology used is the conceptual reference model developed by the international council of museums.

<!-- spellchecker:words upreme nspector athbuilder aaaaaahs -->

**T**om's **I**nspector for **P**athbuilder**s** **Y**aaaaaahs!, or TIPSY for short, is a tool adjacent to WissKI.
Its' goal is to inspect and visualize pathbuilders.
It was built in 2024 by Tom Wiesing to improve on the WissKI interface.

This document is meant to provide generic information about the functionality of the TIPSY tool.
It assumes basic knowledge about pathbuilders and the WissKI software.
For a more thorough introduction to to those topics please refer to the WissKI Documentation at [^2].

## Legal Notices

<Banner>
(the app will include <code>banner.md</code> here)
</Banner>

## Interface Documentation

TIPSY runs entirely inside the browser.
The interface is split into several tabs.
Each tab is documented below.

Each tab usually contains a main panel, as well as an expandable sidebar with additional controls.

**NOTE**: This documentation is still a work-in-progress.

## The Pathbuilder Tab

A pathbuilder can be loaded via the `Pathbuilder` tab.

The inspector supports only `.xml` files at the moment.
Clicking on the Pathbuilder box opens a dialog where the file can be selected.
Alternatively, it can be dragged and dropped into the box to be loaded.

Alternatively, a button to load a sample file is also provided.

<details>
    <summary>How To Create a Pathbuilder XML from within WissKI</summary>

1. Navigate to `Configuration`, `Pathbuilder` and click on `Edit` for the pathbuilder in question.
2. Scroll down to below the path list to the section `Export Templates`.
3. Click on `Create Exportfile`.
4. Click on the `Edit` button for the pathbuilder again.
5. Scroll back down to the `Export Templates` section.
6. A new link with the name of the pathbuilder and the current time should have appeared at the top of the list.
7. Download the linked file using the `.xml` ending.

</details>

When loading fails (e.g. because the file is invalid), an error message is displayed.

After a pathbuilder has been opened, it's name is displayed in the tab instead.
You can chose to save the opened pathbuilder, or close the file.
Saving the pathbuilder also stores the state of the TIPSY interface in the exported file.
All tabs ignore disabled paths.

## The Tree Tab

The Tree Tab shows the pathbuilder as a hierarchical structure: A set of bundles and fields associated with them.
It is similar, although not quite identical, to the pathbuilder overview in WissKI.

In the main panel, each path is represented as a table row.
The collapsible side panel holds additional controls.

The indentation of paths shows their level of nesting within the tree.
Bundles can be collapsed and expanded using a button to hide or reveal the paths that belong to them.
For performance reasons, all bundles are collapsed by default.
For convenience, the side panel holds two buttons `Expand All` and `Collapse All` that expand or collapse all bundles.

Each path displays title, ID, elements, field type as well as cardinality.
The path elements are displayed in a list.
Each type of path element is associated a color, a legend can be found in the side panel.
Importantly, path elements shared with the parent path (e.g. the bundle a field is found in) is displayed in gray.
To save space, all parent elements can be collapsed into a single ellipse (`...`) by enabling a toggle in the sidebar.

Paths can be searched through using a text box.
When entering text, paths are searched based on their title and ID.
Searching is case-insensitive and fuzzy.
All paths matching a given query are highlighted, whereas those not matching the query are faded out.

Paths can be selected using a checkbox.
These checkboxes determine if the selected path is included in the `Bundle Graph` and `Model Graph` views.
The number next to the checkbox indicates how many children of the given path are currently selected.
Users can click a checkbox to toggle selection of a single path, or hold the shift key to toggle a path and all its' children.
The side panel also holds buttons to select `All`, `None`, only `Bundles` or only `Fields`.
You can additionally select only rows that match the current search.
These buttons overwrite any previously made selections.

Each path can be given a color to be used in the Graph Displays using a color input.

Four presets can be applied via the side panel.

- `Orange And Gray`: Assigns bundles the color `orange`, and fields the color `gray`. This is the default.
- `Per Main Bundle`: Assigns a unique color to each path based on the main bundle it belongs to.
- `Per Bundle`: Assigns a unique color to each path based on the bundle it belongs to.
- `Per Path`: Assigns each path a unique color.
  Unique colors are generated automatically by using the golden ratio within the HSV color scheme [^3].

The side panel also allows exporting and importing the colors as a json file.

## The URIs Tab

The URIS tab lists all URIs used by the pathbuilder.
It is still experimental, and currently only available in debug mode.

## The URI Config Tab

The URI Config Tab allows users to configure how URIs are displayed within TIPSY.
In consists of two sections:

- The `Namespace Map`
- The `Inverse Map`

### The Namespace Map

The `Namespace Map` allows the user to view and customize the namespace map used for displaying URIs.
It is used for all tabs within the Inspector.
The underlying pathbuilder always contains the full URIs, and namespace maps are not persisted beyond the current session.

The initial version is generated automatically from all URIs found in the pathbuilder.
Individual namespace URIs can be added, adjusted or deleted.

- To adjust a namespace URI, type the new URI into the URI field.
  Changes are only applied once the `Apply` button is pressed; unapplied changes are discarded when navigating to another tab.
- To delete a namespace URI, click the `Delete` button.
- To add an additional namespace, fill out the `NS` and `URI` fields, and then click the `Add` button.
  Namespaces may only consist of letters, numbers, `-` and `_`s.
  While the values are not valid, it is highlighted in red.

To reset the namespace map to its' default value, click the `Reset To Default` button.

The `Export` and `Import` can be used to export and import the namespace map to a file on disk.
The Namespace Map is saved as a json file.

### The Inverse Map

The `Inverse Map` allows the user to declare two (property) URIs as inverses of each other.
An inverse map contains a list of pairs - the so-called `canonical` URI as well as it's `inverse` URI.
When the graph tabs display an edge labeled with an inverse URI, it's direction is reversed, and it is labeled with the canonical URI instead.
Some renderers also display the inverted URI.

The initial inverse map is empty.
Individual URLs can be added, adjusted or deleted.

- To adjust a URI, type the new URI into the URI field.
  Changes are only applied once the `Apply` button is pressed; unapplied changes are discarded when navigating to another tab.
- To swap a pair around, click the `Swap` button. This is only saved once you hit `Apply`. 
- To delete a URI, click the `Delete` button.
- To add an additional , fill out the `NS` and `URI` fields, and then click the `Add` button.
  Namespaces may only consist of letters, numbers, `-` and `_`s.
  While the values are not valid, it is highlighted in red.

The `Export` and `Import` can be used to export and import the inverse map to a file on disk.
The Inverse Map is saved as a json file.

## The Graph Tabs

The Graph Tabs display the Model and Bundle Graph respectively.
These are explained in the next sections; we first explain the generic graph tab functionality.

A Graph Tab consists of a main panel, which shows the rendered graph, and a side panel, which holds additional controls.
The user can choose a different renderer to show the graph.

The supported renderers are:

- [viz-js](https://github.com/mdaines/viz-js), a JavaScript port of the popular [GraphViz](https://graphviz.org/) application;
- [vis-network](https://github.com/visjs/vis-network);
- [sigma.js](https://www.sigmajs.org/); and
- [Cytoscape.js](https://js.cytoscape.org/)

Each renderer supports different layouts for the graph.
After selecting a renderer, a layout can also be chosen.

Some layouts involve randomness in the initial node positions.
For this purpose, a random `Seed` can be specified, or randomized.
This is used to initialize an appropriate PRNG [^4].
Not all renderers and layouts make use of the seed, and the graph layout make look identical despite choosing a different seed.

Some renderers do not produce a static graph layout; instead they use a physics simulation to progressively animate the node positions.
This simulation can be stopped and started using `Start` and `Stop` buttons.
These are disabled, when an animation is not supported.
As some renderers also support dragging nodes around, a `Reset` button exists to completely reset their positions.

Some renderers also allow exporting the graph in various formats.
The formats include SVG (`Graphviz` only), GV (`Graphviz only`) and PNG (`vis-network`, `Sigma.js` only).
If supported by the currently selected renderer, one button is displayed for each format.

### Bundle Graph

The Bundle graph displays each path as a node in a graph.
Two such nodes are connected if their corresponding paths have a `parent-child` relationship.
For example a field is connected with its' containing bundle.

The Bundle graph uses the path titles as labels for each node.
It only includes paths selected in the `Tree` Tab; coloring each with the configured color.

### Model Graph

The Model Graph visualizes structure of the graph produced by WissKI when using the pathbuilder.
Its' nodes are the concept and literal nodes, it's edges are the appropriate properties.
Additionally, the model graph annotates where each bundle and (datatype and non-datatype)field is located.

As before, this graph only includes nodes selected in the tree tab.
An additional `Display` control allows toggling on and off different kinds of labels.
If supported by the renderer, changing the `Display` control does not reset the nodes positions within the displayed graph.

#### Path Drawing

To produce a model graph, TIPSY iterates over all included paths.
For the elements of these paths, each class is drawn as a concept node.
Then these concepts are connected using edges labeled with their properties.
Finally literal nodes are drawn where a datatype property exists.

Classes typically occur in the pathbuilder more than once.
Usually, each class would be shown as many times as each occurs.
Instead, it sometimes makes sense to deduplicate nodes and only show classes fewer times.

This can be configured in the side panel using the `Deduplication` control.
It has the following options:

- **Bundle**. Draw each class once within the current bundle. Default.
- **Full**. Draws each class at most once. This corresponds to drawing a subset of the associated ontology with its' domains and ranges.
- **Parents**. Re-uses nodes when they occur in the parent path.
- **None**. Does not deduplicate nodes at all.

As changing the deduplication strategy produces a different model graph, changing the setting resets node positions for the current renderer.

#### Path Annotations

In addition, the model graph overlays the model nodes with the location of each bundle and field.
Fields are split into `Data Fields` (those at a literal node that have a `Datatype Property`) and `Concept Fields` (those at a concept node).
Each of these can be toggled off individually in the `Display` control.

By default these annotations are associated with the corresponding concept or literal node using a box [^5].
Then, each annotation is given the color selected in the `Tree` Tab.
For concepts and literals, the boxes around these annotations can be toggled on or off, allowing the renderers layout to position the nodes more freely.
The new positioning is only applied once the node positions are reset using the `Reset` button in the `Renderer` control.

Instead of showing each annotation as an attached node, it is also possible to collapse them into a single node along with the concept or literal node.
This is achieved by toggling off the `Complex` switch.
In this case it's color is determined by the most important annotation.
Most important means the path with the fewest number of descendants, or (if several nodes have the same number of descendants) the one higher in the pathbuilder.

## The About Tab

Contains this document.

[^1]: https://wiss-ki.eu/

[^2]: https://wiss-ki.eu/documentation

[^3]: https://en.wikipedia.org/wiki/HSL_and_HSV

[^4]: https://en.wikipedia.org/wiki/Pseudorandom_number_generator

[^5]: Not all renderers support boxes.

<!-- spellchecker:words PRNG -->
