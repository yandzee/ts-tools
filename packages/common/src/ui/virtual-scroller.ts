import { range2 } from '~/misc/utils';

export interface VScrollerProps {
  amount: number;
  itemHeight: number;
  poolSize?: (n: number) => number;
}

// NOTE: Mapping {idx -> virtual idx}
export type Positions = number[];

export class VirtualScroller {
  public static readonly INVISIBLE_VIRTUAL_INDEX = -9999;

  private lastScroll = 0;
  private lastPositions: Positions = [];
  private lastHeight = 0;

  public poolSize: number = 0;

  constructor(public readonly props: VScrollerProps) {
    if (props.itemHeight === 0) {
      throw new Error(
        `VirtualScroller: cannot create instance with zero item height`
      );
    }
  }

  public scrollChanged(scroll: number): [Positions, boolean] {
    if (this.lastScroll === scroll) return [this.lastPositions, false];

    const delta = scroll >= this.lastScroll ? 1 : -1;
    this.lastScroll = scroll;

    if (this.lastPositions.length === 0) {
      this.lastPositions = this.computePositions(delta);

      return [this.lastPositions, true];
    }

    // NOTE: Let's consider the case when we already have elements placed as needed
    const [firstVisibleIdx, lastVisibleIdx] = this.getVisibleIndices();
    const currentIndices = new Set(this.lastPositions);

    // NOTE: Case when currentItems already contain required items
    if (
      currentIndices.has(firstVisibleIdx) &&
      currentIndices.has(lastVisibleIdx)
    ) {
      return [this.lastPositions, false];
    }

    // NOTE: The opposite case: when no required items positioned
    if (
      !currentIndices.has(firstVisibleIdx) &&
      !currentIndices.has(lastVisibleIdx)
    ) {
      this.lastPositions = this.computePositions(delta);
      return [this.lastPositions, true];
    }

    currentIndices.delete(VirtualScroller.INVISIBLE_VIRTUAL_INDEX);
    const maxPossibleIdx = Math.max(0, this.props.amount - 1);
    const requiredIndices = new Set(
      range2(firstVisibleIdx, lastVisibleIdx + 1)
    );

    let offset = 1;

    // NOTE: We are here when we have overlapping: some items placed well
    for (let realIdx = 0; realIdx < this.lastPositions.length; realIdx += 1) {
      const virtualIdx = this.lastPositions[realIdx];

      if (virtualIdx >= firstVisibleIdx && virtualIdx <= lastVisibleIdx) {
        requiredIndices.delete(virtualIdx);
        continue;
      }

      // NOTE: This cycle picks next required index and point `realIdx` to it
      if (requiredIndices.size > 0) {
        for (const requiredIndex of requiredIndices) {
          if (currentIndices.has(requiredIndex)) {
            requiredIndices.delete(requiredIndex);
            continue;
          }

          this.lastPositions[realIdx] = requiredIndex;
          requiredIndices.delete(requiredIndex);
          break;
        }

        continue;
      }

      // NOTE: This is possible because pool is likely greater than the number
      // of elements in the visible area. Those remaining items point to
      // invisible items and we need to remap them.
      const vidx =
        delta > 0
          ? offset > 0
            ? lastVisibleIdx + offset
            : firstVisibleIdx + offset
          : offset > 0
            ? firstVisibleIdx - offset
            : lastVisibleIdx - offset;

      if (vidx < 0 || vidx > maxPossibleIdx) {
        this.lastPositions[realIdx] = VirtualScroller.INVISIBLE_VIRTUAL_INDEX;
      } else {
        this.lastPositions[realIdx] = vidx;
      }

      offset += 1;
    }

    if (requiredIndices.size > 0) {
      throw new Error(`VirtualScroller: pool size is incorrect`);
    }

    return [this.lastPositions, true];
  }

  public heightChanged(height: number): [Positions, boolean] {
    this.lastHeight = height;

    const poolSizeModifier = this.props.poolSize || ((n) => n);
    const poolSize = poolSizeModifier(
      Math.ceil(height / this.props.itemHeight)
    );

    if (this.poolSize === poolSize) return [this.lastPositions, false];
    this.poolSize = poolSize;

    this.lastPositions = this.computePositions();
    return [this.lastPositions, true];
  }

  public computePositions(scrollDelta: number = 1): Positions {
    const [firstVisibleIdx, lastVisibleIdx] = this.getVisibleIndices();

    const maxPossibleIdx = this.props.amount - 1;
    const positions: Positions = Array(this.poolSize).fill(0);

    // NOTE: Use scroll delta to understand in which direction the scrolling is
    // going and where we need to place our items
    if (scrollDelta >= 0) {
      for (let i = 0; i < this.poolSize; i += 1) {
        let vidx = i + firstVisibleIdx;

        if (vidx <= maxPossibleIdx) {
          positions[i] = vidx;
          continue;
        }

        // NOTE: Use remaining items and point them before firstVisibleIdx
        while (i < this.poolSize) {
          vidx = maxPossibleIdx - i;
          positions[i] =
            vidx < 0 ? VirtualScroller.INVISIBLE_VIRTUAL_INDEX : vidx;
          i += 1;
        }

        break;
      }
    } else {
      for (let i = this.poolSize - 1; i >= 0; i -= 1) {
        let vidx = lastVisibleIdx - (this.poolSize - 1 - i);

        if (vidx >= 0) {
          positions[i] = vidx;
          continue;
        }

        // NOTE: Use remaining items and point them after lastVisibleIdx
        while (i >= 0) {
          vidx = this.poolSize - 1 - i;

          positions[i] =
            vidx > maxPossibleIdx
              ? VirtualScroller.INVISIBLE_VIRTUAL_INDEX
              : vidx;

          i -= 1;
        }

        break;
      }
    }

    return positions;
  }

  private getVisibleIndices(): [number, number] {
    const firstVisibleIdx = Math.floor(this.lastScroll / this.props.itemHeight);
    const itemsInScrollAndViewport = Math.ceil(
      (this.lastHeight + this.lastScroll) / this.props.itemHeight
    );
    const lastVisibleIdx = Math.max(0, itemsInScrollAndViewport - 1);

    return [firstVisibleIdx, lastVisibleIdx];
  }
}
