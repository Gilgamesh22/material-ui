import React from 'react';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import TreeViewContext from './TreeViewContext';
import TreeItem from '../TreeItem';
import { withStyles } from '@material-ui/core/styles';

export const styles = {
  /* Styles applied to the root element. */
  root: {
    padding: 0,
    margin: 0,
    listStyle: 'none',
  },
};

const defaultExpandedDefault = [];

const TreeView = React.forwardRef(function TreeView(props, ref) {
  const {
    children,
    classes,
    className,
    defaultCollapseIcon,
    defaultEndIcon,
    defaultExpanded = defaultExpandedDefault,
    defaultExpandIcon,
    defaultParentIcon,
    isNodeExpandable,
    isNodeCheckable,
    treeItemInfo,
    onNodeChecked,
    onNodeCollapsed,
    onNodeExpanded,
    onNodeToggle,
    ...other
  } = props;

  // tab is hit tabable is the control that will take focus
  const [tabable, setLocalTabable] = React.useState(null);
  const [focused, setFocused] = React.useState(null);

  const staticChildren = React.useRef(null);
  const nodeMap = React.useRef({});

  const setTabable = id => {
    setLocalTabable(id);
    const map = nodeMap.current[id];
    if (map && map.forceUpdate) map.forceUpdate();
  };

  const isExpanded = id => nodeMap.current[id].expanded;
  const isTabable = id => tabable === id;
  const isFocused = id => focused === id;

  React.useEffect(() => {
    if (children != null) {
      

    }



  }, [children])

  const getChildren = id => nodeMap.current[id].childComponents;
  const getId = node => node.component.props.nodeId;

  const handleNodeMap = React.useCallback(
    (id, treeItemChildren, forceUpdate) => {
      const map = nodeMap.current[id];
      if (forceUpdate) map.forceUpdate = forceUpdate;
      if (treeItemChildren) {
        map.childComponents = treeItemChildren;
        map.children = React.Children.map(treeItemChildren, child => {
          nodeMap.current[child.props.nodeId] = {
            component: child,
            parent: id,
            expanded:
              child.props.expanded ||
              defaultExpanded.find(expandedID => expandedID === child.props.nodeId) !== undefined,
          };
          handleNodeMap(child.props.nodeId, child.props.children);
          return nodeMap.current[child.props.nodeId];
        });
      }
      return map;
    },
    [defaultExpanded],
  );

  const updateNodeMap = React.useCallback(
    (id, myTreeItems) => {
      const createTreeItems = myTreeItemsInfo => {
        if (myTreeItemsInfo) {
          const treeItemChildren = myTreeItemsInfo.map((child, i) => {
            const childChildren = createTreeItems(child.children);
            const { children: _children, ...childPrams } = child;
            return (
              <TreeItem {...childPrams} key={i}>
                {childChildren}
              </TreeItem>
            );
          });
          return treeItemChildren;
        }
        return undefined;
      };

      const addToNodeMap = (myId, myTreeItemsInfo) => {
        handleNodeMap(myId, myTreeItemsInfo);
        React.Children.map(myTreeItemsInfo, child => {
          addToNodeMap(child.props.nodeId, child.props.children);
        });
      };
      addToNodeMap(id, createTreeItems(myTreeItems));
    },
    [handleNodeMap],
  );

  React.useEffect(() => {
    nodeMap.current[-1] = { parent: null };

    if (children) {
      handleNodeMap(-1, children);
    } else if (treeItemInfo) {
      updateNodeMap(-1, treeItemInfo);
    } else if (onNodeExpanded) {
      const info = onNodeExpanded(undefined);
      if (info && Array.isArray(info)) updateNodeMap(-1, info);
    }

    (nodeMap.current[-1].children || []).forEach((child, index) => {
      if (index === 0) {
        setTabable(getId(child));
      }
      nodeMap.current[getId(child)].parent = null;
    });
  }, [children, handleNodeMap, isNodeExpandable, onNodeExpanded, treeItemInfo, updateNodeMap]);

  const getLastNode = React.useCallback(id => {
    const map = nodeMap.current[id];
    if (map.expanded && map.children && map.children.length > 0) {
      return getLastNode(getId(map.children[map.children.length - 1]));
    }
    return id;
  }, []);

  const getFirstNode = () => {
    if (nodeMap.current[-1].children && nodeMap.current[-1].children.length) {
      return getId(nodeMap.current[-1].children[0]);
    }
    return undefined;
  };

  const focus = id => {
    if (id) {
      setTabable(id);
    }
    setFocused(id);
  };

  const getNextNode = (id, end) => {
    const map = nodeMap.current[id];
    const parent = nodeMap.current[map.parent];

    if (!end) {
      if (map.expanded) {
        return getId(map.children[0]);
      }
    }
    if (parent) {
      const nodeIndex = parent.children.findIndex(child => getId(child) === id);
      const nextIndex = nodeIndex + 1;
      if (parent.children.length > nextIndex) {
        return getId(parent.children[nextIndex]);
      }
      return getNextNode(getId(parent), true);
    }
    const topLevelNodes = nodeMap.current[-1].children;
    const topLevelNodeIndex = topLevelNodes.findIndex(child => getId(child) === id);
    if (topLevelNodeIndex !== -1 && topLevelNodeIndex !== topLevelNodes.length - 1) {
      return getId(topLevelNodes[topLevelNodeIndex + 1]);
    }

    return null;
  };

  const getPreviousNode = id => {
    const map = nodeMap.current[id];
    const parent = nodeMap.current[map.parent];

    if (parent) {
      const nodeIndex = parent.children.findIndex(child => getId(child) === id);
      if (nodeIndex !== 0) {
        const nextIndex = nodeIndex - 1;
        return getLastNode(getId(parent.children[nextIndex]));
      }
      return getId(parent);
    }
    const topLevelNodes = nodeMap.current[-1].children;
    const topLevelNodeIndex = topLevelNodes.findIndex(child => getId(child) === id);
    if (topLevelNodeIndex > 0) {
      return getLastNode(getId(topLevelNodes[topLevelNodeIndex - 1]));
    }

    return null;
  };

  const focusNextNode = id => {
    const nextNode = getNextNode(id);
    if (nextNode) {
      focus(nextNode);
    }
  };
  const focusPreviousNode = id => {
    const previousNode = getPreviousNode(id);
    if (previousNode) {
      focus(previousNode);
    }
  };
  const focusFirstNode = () => {
    const firstNode = getFirstNode();
    if (firstNode) {
      focus(firstNode);
    }
  };

  const focusLastNode = () => {
    const topLevelNodes = nodeMap.current[-1].children;
    const lastNode = getLastNode(getId(topLevelNodes[topLevelNodes.length - 1]));
    focus(lastNode);
  };

  const toggle = (id = focused) => {
    const map = nodeMap.current[id];
    map.expanded = !map.expanded;

    if (onNodeToggle) {
      onNodeToggle(id, map.expanded);
    }
    if (onNodeCollapsed && !map.expanded) {
      onNodeCollapsed(id);
    }
    if (onNodeExpanded && map.expanded) {
      const itemsChildren = onNodeExpanded(id);
      if (itemsChildren) {
        updateNodeMap(id, itemsChildren);
      }
    }
    setTabable(id);
    return map.expanded;
  };

  const expandAllSiblings = id => {
    const map = nodeMap.current[id];
    let parent = nodeMap.current[map.parent];

    if (!parent) {
      parent = nodeMap.current[-1];
    }

    parent.children.forEach(child => {
      if (!child.expanded) toggle(getId(child));
    });
  };

  const handleLeftArrow = (id, event) => {
    const map = nodeMap.current[id];
    let flag = false;
    if (map.expanded) {
      toggle(id);
      flag = true;
    } else {
      const parent = map.parent;
      if (parent) {
        focus(parent);
        flag = true;
      }
    }

    if (flag && event) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  const setFocusByFirstCharacter = (id, char) => {
    const lowercaseChar = char.toLowerCase();

    let nextId = getNextNode(id);
    while (nextId) {
      const map = nodeMap.current[nextId];
      if (map.lowercaseChar === lowercaseChar) break;
      nextId = getNextNode(nextId);
    }

    if (nextId === null) {
      nextId = getFirstNode();
      while (nextId !== id) {
        const map = nodeMap.current[nextId];
        if (map.lowercaseChar === lowercaseChar) break;
        nextId = getNextNode(nextId);
      }
      if (nextId === id) nextId = undefined;
    }

    // If match was found...
    if (nextId) {
      focus(nextId);
    }
  };

  const getItemChildren = id => {
    if (nodeMap.current[id]) return nodeMap.current[id].childComponents;
    return undefined;
  };

  const isExpandable = React.useCallback(
    async (id) => {
      const mod = nodeMap.current[id];
      if (mod.children) {
        return true;
      }
      if (isNodeExpandable) {
        const val = await isNodeExpandable(id);
        return val;
      }
      return false;
    },
    [isNodeExpandable],
  );

  const onItemChecked = React.useCallback(
    (id, checked) => {
      onNodeChecked(id, checked)
    }
  , [onNodeChecked]);

  return (
    <TreeViewContext.Provider
      value={{
        expandAllSiblings,
        getChildren,
        focus,
        focusFirstNode,
        focusLastNode,
        focusNextNode,
        focusPreviousNode,
        handleLeftArrow,
        handleNodeMap,
        icons: { defaultCollapseIcon, defaultExpandIcon, defaultParentIcon, defaultEndIcon },
        isExpandable,
        isExpanded,
        isFocused,
        isTabable,
        onItemChecked: onNodeChecked? onItemChecked: undefined,
        setFocusByFirstCharacter,
        toggle,
      }}
    >
      <ul role="tree" className={clsx(classes.root, className)} ref={ref} {...other}>
        {getItemChildren(-1)}
      </ul>
    </TreeViewContext.Provider>
  );
});

TreeView.propTypes = {
  /**
   * The content of the component.
   */
  children: PropTypes.node,
  /**
   * Override or extend the styles applied to the component.
   * See [CSS API](#css) below for more details.
   */
  classes: PropTypes.object.isRequired,
  /**
   * @ignore
   */
  className: PropTypes.string,
  /**
   * The default icon used to collapse the node.
   */
  defaultCollapseIcon: PropTypes.node,
  /**
   * The default icon displayed next to a end node. This is applied to all
   * tree nodes and can be overridden by the TreeItem `icon` prop.
   */
  defaultEndIcon: PropTypes.node,
  /**
   * Expanded node ids.
   */
  defaultExpanded: PropTypes.arrayOf(PropTypes.string),
  /**
   * The default icon used to expand the node.
   */
  defaultExpandIcon: PropTypes.node,
  /**
   * The default icon displayed next to a parent node. This is applied to all
   * parent nodes and can be overridden by the TreeItem `icon` prop.
   */
  defaultParentIcon: PropTypes.node,
  /**
   * Callback fired when a `TreeItem` needs to know if it has children.
   * This is used if you would like to load children nodes virtually
   *
   * @param {string} nodeId The id of the node. If nodeId is undefined then the node in question is the root node.
   * @return {boolean} - If `true` the contains children. If `false` the node does not contain children. if undefined use React.Children.
   */
  isNodeExpandable: PropTypes.func,
   /**
   * Callback fired when a `TreeItem` is checked
   *
   * @param {string} nodeId The id of the node.
   * @param {boolean} the state of the node.
   */
  onNodeChecked: PropTypes.func,
  /**
   * Callback fired when a `TreeItem` is collapsed
   *
   * @param {string} nodeId The id of the node.
   */
  onNodeCollapsed: PropTypes.func,
  /**
   * Callback fired when a `TreeItem` is expanded.
   * This can also be used to load children nodes virtually
   *
   * @param {string} nodeId The id of the node. If nodeId is undefined then the node in question is the root node.
   * @return {PropTypes.object} - the children of the Item. undefined can be returned to use React.Children.
   */
  onNodeExpanded: PropTypes.func,
  /**
   * Callback fired when a `TreeItem` is expanded/collapsed.
   *
   * @param {string} nodeId The id of the toggled node.
   * @param {boolean} expanded The node status - If `true` the node was expanded. If `false` the node was collapsed.
   */
  onNodeToggle: PropTypes.func,
  /**
   * treeItemInfo can be used to give the layout of the treeView in object notation.
   */
  treeItemInfo: PropTypes.arrayOf(PropTypes.object),
};

export default withStyles(styles, { name: 'MuiTreeView' })(TreeView);
