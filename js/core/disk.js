export const TOTAL_BLOCKS = 100;

export const BLOCK_SIZE_BYTES = 4096;

export const POINTER_SIZE_BYTES = 4;


/*
  Create Virtual Disk.

  Each block stores:
  - id
  - FREE / USED
  - owner
  - allocation method
  - DATA / INDEX
  - next pointer for Linked
  - index entries for Indexed
*/

export function createDisk(
  numberOfBlocks = TOTAL_BLOCKS
) {

  const blocks = [];

  for (
    let i = 0;
    i < numberOfBlocks;
    i++
  ) {

    blocks.push({

      id: i,

      status: "FREE",

      fileId: null,

      allocationMethod: null,

      kind: null,

      nextBlock: null,

      indexEntries: []

    });

  }

  return blocks;
}


/*
  Return all FREE blocks.
*/

export function getFreeBlocks(disk) {

  return disk.filter(
    (block) =>
      block.status === "FREE"
  );

}


/*
  Count FREE blocks.
*/

export function countFreeBlocks(disk) {

  return getFreeBlocks(disk).length;

}


/*
  Find the largest sequence of
  consecutive FREE blocks.
*/

export function getLargestFreeBlockSequence(
  disk
) {

  let currentLength = 0;

  let largestLength = 0;


  disk.forEach((block) => {

    if (block.status === "FREE") {

      currentLength++;

      if (
        currentLength > largestLength
      ) {

        largestLength =
          currentLength;

      }

    } else {

      currentLength = 0;

    }

  });


  return largestLength;
}


/*
  Release all blocks belonging
  to one file.
*/

export function releaseFile(
  disk,
  fileId
) {

  disk.forEach((block) => {

    if (block.fileId === fileId) {

      block.status = "FREE";

      block.fileId = null;

      block.allocationMethod = null;

      block.kind = null;

      block.nextBlock = null;

      block.indexEntries = [];

    }

  });

}


/*
  Prepare a fragmented disk.

  Existing files occupy several
  separated areas.

  Free regions are intentionally
  kept small.

  This allows Contiguous Allocation
  to fail even when total FREE blocks
  are sufficient.
*/

export function createFragmentationScenario(
  disk
) {

  /*
    First reset every block.
  */

  disk.forEach((block) => {

    block.status = "FREE";

    block.fileId = null;

    block.allocationMethod = null;

    block.kind = null;

    block.nextBlock = null;

    block.indexEntries = [];

  });


  /*
    USED ranges.

    They create FREE gaps of around
    4-6 blocks rather than one large
    free area.
  */

  const usedRanges = [

    [0, 7],

    [13, 20],

    [26, 34],

    [40, 47],

    [53, 61],

    [67, 74],

    [80, 88],

    [94, 99]

  ];


  usedRanges.forEach(
    ([start, end], rangeIndex) => {

      for (
        let i = start;
        i <= end;
        i++
      ) {

        disk[i].status = "USED";

        disk[i].fileId =
          `OLD-${rangeIndex + 1}`;

        disk[i].allocationMethod =
          "SCENARIO";

        disk[i].kind = "DATA";

      }

    }
  );

}
