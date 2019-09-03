/* eslint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions  */
import React from 'react';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import Typography from '@material-ui/core/Typography';
import Collapse from '@material-ui/core/Collapse';
import { withStyles } from '@material-ui/core/styles';
import { useForkRef } from '@material-ui/core/utils';
import TreeViewContext from '../TreeView/TreeViewContext';

export const styles = theme => ({
  /* Styles applied to the root element. */
  root: {
    listStyle: 'none',
    margin: 0,
    padding: 0,
    outline: 0,
    '&:focus > $content': {
      backgroundColor: theme.palette.grey[400],
    },
  },
  /* Styles applied to the `role="group"` element. */
  group: {
    margin: 0,
    padding: 0,
    marginLeft: 26,
  },
  /* Styles applied to the tree node content. */
  content: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
  },
  /* Styles applied to the tree node icon and collapse/expand icon. */
  iconContainer: {
    marginRight: 2,
    width: 24,
    display: 'flex',
    justifyContent: 'center',
  },
  /* Styles applied to the label element. */
  label: {},
});

const isPrintableCharacter = str => {
  return str && str.length === 1 && str.match(/\S/);
};

const TreeItem = React.forwardRef(function TreeItem(props, ref) {
  const {
    checked,
    children,
    classes,
    className,
    collapseIcon,
    endIcon,
    expandIcon,
    icon: iconProp,
    label,
    nodeId,
    onClick,
    onFocus,
    onKeyDown,
    TransitionComponent = Collapse,
    ...other
  } = props;

  const {
    expandAllSiblings,
    getChildren,
    focus,
    focusFirstNode,
    focusLastNode,
    focusNextNode,
    focusPreviousNode,
    handleLeftArrow,
    handleNodeMap,
    icons: contextIcons,
    isExpanded,
    isExpandable,
    isFocused,
    isTabable,
    setFocusByFirstCharacter,
    onItemChecked,
    toggle,
  } = React.useContext(TreeViewContext);

  const firstRun = React.useRef(true);
  const nodeRef = React.useRef(null);
  const contentRef = React.useRef(null);
  const handleRef = useForkRef(nodeRef, ref);
  const [isChecked, setIsChecked] = React.useState(checked);

  let icon = iconProp;

  const [{ expanded }, setExpanded] = React.useState({ expanded: isExpanded(nodeId) });

  const expandable = isExpandable(nodeId);
  const myChildren = getChildren(nodeId);
  const focused = isFocused ? isFocused(nodeId) : false;
  const tabable = isTabable ? isTabable(nodeId) : false;
  const icons = contextIcons || {};

  if (!icon) {
    if (expandable) {
      if (!expanded) {
        icon = expandIcon || icons.defaultExpandIcon;
      } else {
        icon = collapseIcon || icons.defaultCollapseIcon;
      }

      if (!icon) {
        icon = icon || icons.defaultParentIcon;
      }
    } else {
      icon = icons.defaultEndIcon;
    }
  }

  const handleClick = event => {
    if (!focused) {
      focus(nodeId);
    }

    if (expandable) {
      toggle(nodeId);
    }

    if (onClick) {
      onClick(event);
    }
    setExpanded({ expanded: isExpanded(nodeId) });
  };

  const handleKeyDown = event => {
    let flag = false;
    const key = event.key;

    const printableCharacter = () => {
      if (key === '*') {
        expandAllSiblings(nodeId);
        flag = true;
      } else if (isPrintableCharacter(key)) {
        setFocusByFirstCharacter(nodeId, key);
        flag = true;
      }
    };

    if (event.altKey || event.ctrlKey || event.metaKey) {
      return;
    }
    switch (key) {
      case 'Enter':
      case ' ':
        if (nodeRef.current === event.currentTarget && expandable) {
          toggle();
          flag = true;
        }
        event.stopPropagation();
        break;
      case 'ArrowDown':
        focusNextNode(nodeId);
        flag = true;
        break;
      case 'ArrowUp':
        focusPreviousNode(nodeId);
        flag = true;
        break;
      case 'ArrowRight':
        if (expandable) {
          if (expanded) {
            focusNextNode(nodeId);
          } else {
            toggle();
          }
        }
        flag = true;
        break;
      case 'ArrowLeft':
        handleLeftArrow(nodeId, event);
        break;
      case 'Home':
        focusFirstNode();
        flag = true;
        break;
      case 'End':
        focusLastNode();
        flag = true;
        break;
      default:
        if (isPrintableCharacter(key)) {
          printableCharacter();
        }
    }

    if (flag) {
      event.preventDefault();
      event.stopPropagation();
    }

    if (onKeyDown) {
      onKeyDown(event);
    }
  };

  const handleFocus = event => {
    if (!focused && tabable) {
      focus(nodeId);
    }

    if (onFocus) {
      onFocus(event);
    }
  };

  const handleChecked = event => {
    event.preventDefault();
    onItemChecked(nodeId, event);
    setIsChecked(!isChecked);
  };

  React.useEffect(() => {
    if (firstRun.current) {
      handleNodeMap(nodeId, children);
      setExpanded({ expanded: isExpanded(nodeId) });
    }
    firstRun.current = false;
  }, [children, handleNodeMap, nodeId, isExpanded]);

  React.useEffect(() => {
    if (focused) {
      nodeRef.current.focus();
    }
  }, [focused]);

  return (
    <li
      className={clsx(classes.root, className)}
      role="treeitem"
      onKeyDown={handleKeyDown}
      onFocus={handleFocus}
      aria-expanded={expandable ? expanded : null}
      ref={handleRef}
      tabIndex={tabable ? 0 : -1}
      {...other}
    >
      <div className={classes.content} onClick={handleClick} ref={contentRef}>
        {icon ? <div className={classes.iconContainer}>{icon}</div> : null}
        {onItemChecked ? (
          <input type="checkbox" checked={isChecked} onChange={handleChecked} />
        ) : null}
        <Typography className={classes.label}>{label}</Typography>
      </div>
      {myChildren && (
        <TransitionComponent
          unmountOnExit
          className={classes.group}
          in={expanded}
          component="ul"
          role="group"
        >
          {myChildren}
        </TransitionComponent>
      )}
    </li>
  );
});

TreeItem.propTypes = {
  /**
   * Identify if a Item is Checked or not.
   */
  checked: PropTypes.bool,
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
   * The icon used to collapse the node.
   */
  collapseIcon: PropTypes.node,
  /**
   * The icon displayed next to a end node.
   */
  endIcon: PropTypes.node,
  /**
   * The icon used to expand the node.
   */
  expandIcon: PropTypes.node,
  /**
   * The icon to display next to the tree node's label.
   */
  icon: PropTypes.node,
  /**
   * The tree node label.
   */
  label: PropTypes.node,
  /**
   * The id of the node.
   */
  nodeId: PropTypes.string.isRequired,
  /**
   * @ignore
   */
  onClick: PropTypes.func,
  /**
   * @ignore
   */
  onFocus: PropTypes.func,
  /**
   * @ignore
   */
  onKeyDown: PropTypes.func,
  /**
   * The component used for the transition.
   */
  TransitionComponent: PropTypes.elementType,
};

export default withStyles(styles, { name: 'MuiTreeItem' })(TreeItem);
