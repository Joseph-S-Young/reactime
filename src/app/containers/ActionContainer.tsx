// @ts-nocheck
import React, { useEffect } from 'react';
import Action from '../components/Action';
import SwitchAppDropdown from '../components/SwitchApp';
import { emptySnapshots, changeView, changeSlider } from '../actions/actions';
import { useStoreContext } from '../store';

const resetSlider = () => {
  const slider = document.querySelector('.rc-slider-handle');
  if (slider) {
    slider.setAttribute('style', 'left: 0');
  }
};

function ActionContainer(props): JSX.Element {
  const [{ tabs, currentTab }, dispatch] = useStoreContext();
  const {
    currLocation, hierarchy, sliderIndex, viewIndex, snapshots,
  } = tabs[currentTab];
  const { toggleActionContainer, actionView, setActionView } = props;
  let actionsArr = [];
  const hierarchyArr: any[] = [];

  // function to traverse state from hierarchy and also getting information on display name and component name
  const displayArray = (obj: {
    stateSnapshot: { children: any[] };
    name: number;
    branch: number;
    index: number;
    children?: [];
  }) => {
    if (
      obj.stateSnapshot.children.length > 0
      && obj.stateSnapshot.children[0]
      && obj.stateSnapshot.children[0].state
      && obj.stateSnapshot.children[0].name
    ) {
      const newObj: Record<string, unknown> = {
        index: obj.index,
        displayName: `${obj.name}.${obj.branch}`,
        state: obj.stateSnapshot.children[0].state,
        componentName: obj.stateSnapshot.children[0].name,
        // nathan testing new entries for component name, original above
        // componentName: findDiff(obj.index),
        componentData:
          JSON.stringify(obj.stateSnapshot.children[0].componentData) === '{}'
            ? ''
            : obj.stateSnapshot.children[0].componentData,
      };
      hierarchyArr.push(newObj);
    }
    if (obj.children) {
      obj.children.forEach(element => {
        displayArray(element);
      });
    }
  };
  // the hierarchy gets set on the first click in the page
  // when page in refreshed we may not have a hierarchy so we need to check if hierarchy was initialized
  // if true invoke displayArray to display the hierarchy
  if (hierarchy) displayArray(hierarchy);

  // handles keyboard presses, function passes an event and index of each action-component
  function handleOnKeyDown(e: KeyboardEvent, i: number) {
    let currIndex = i;
    // up arrow key pressed
    if (e.key === 'ArrowUp') {
      currIndex -= 1;
      if (currIndex < 0) return;
      dispatch(changeView(currIndex));
    }
    // down arrow key pressed
    else if (e.key === 'ArrowDown') {
      currIndex += 1;
      if (currIndex > hierarchyArr.length - 1) return;
      dispatch(changeView(currIndex));
    }
    // enter key pressed
    else if (e.key === 'Enter') {
      e.stopPropagation();
      e.preventDefault(); // needed or will trigger onClick right after
      dispatch(changeSlider(currIndex));
    }
  }
  // Sort by index.
  hierarchyArr.sort((a, b) => a.index - b.index);
  actionsArr = hierarchyArr.map(
    (
      snapshot: {
        state?: Record<string, unknown>;
        index: number;
        displayName: string;
        componentName: string;
        componentData: { actualDuration: number } | undefined;
      },
    ) => {
      const { index } = snapshot;
      const selected = index === viewIndex;
      const last = viewIndex === -1 && index === hierarchyArr.length - 1;
      const isCurrIndex = index === currLocation.index;
      return (
        <Action
          key={`action${index}`}
          index={index}
          state={snapshot.state}
          displayName={snapshot.displayName}
          componentName={snapshot.componentName}
          componentData={snapshot.componentData}
          selected={selected}
          last={last}
          dispatch={dispatch}
          sliderIndex={sliderIndex}
          handleOnkeyDown={handleOnKeyDown}
          viewIndex={viewIndex}
          isCurrIndex={isCurrIndex}
        />
      );
    },
  );
  useEffect(() => {
    setActionView(true);
  }, [setActionView]);

  // the conditional logic below will cause ActionContainer.test.tsx to fail as it cannot find the Empty button
  // UNLESS actionView={true} is passed into <ActionContainer /> in the beforeEach() call in ActionContainer.test.tsx
  return (
    <div id="action-id" className="action-container">
      <div id="arrow">
        <aside className="aside">
          <a onClick={toggleActionContainer} className="toggle">
            <i />
          </a>
        </aside>
      </div>
      {actionView ? (
        <div className="action-button-wrapper">
          <SwitchAppDropdown />
          <div className="action-component exclude">
            <button
              className="empty-button"
              onClick={() => {
                dispatch(emptySnapshots());
                // set slider back to zero, visually
                resetSlider();
              }}
              type="button"
            >
              Clear
            </button>
          </div>
          <div>{actionsArr}</div>
        </div>
      ) : null}
    </div>
  );
}

export default ActionContainer;
