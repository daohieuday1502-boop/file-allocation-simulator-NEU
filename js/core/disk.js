export const TOTAL_BLOCKS = 100;

export const BLOCK_SIZE_BYTES = 4096;

export const POINTER_SIZE_BYTES = 4;


/*
  Create Virtual Disk
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
  Return all FREE blocks
*/

export function getFreeBlocks(disk) {

  return disk.filter(
    (block) =>
      block.status === "FREE"
  );

}


/*
  Count FREE blocks
*/

export function countFreeBlocks(disk) {

  return getFreeBlocks(disk).length;

}


/*
  Find the longest sequence
  of consecutive FREE blocks
*/

export function getLargestFreeBlockSequence(
  disk
) {

  let currentLength = 0;

  let largestLength = 0;


  disk.forEach((block) => {

    if (
      block.status === "FREE"
    ) {

      currentLength++;


      if (
        currentLength >
        largestLength
      ) {

        largestLength =
          currentLength;

      }

    }

    else {

      currentLength = 0;

    }

  });


  return largestLength;

}


/*
  Release all blocks
  belonging to a file
*/

export function releaseFile(
  disk,
  fileId
) {

  disk.forEach((block) => {

    if (
      block.fileId === fileId
    ) {

      block.status =
        "FREE";

      block.fileId =
        null;

      block.allocationMethod =
        null;

      block.kind =
        null;

      block.nextBlock =
        null;

      block.indexEntries =
        [];

    }

  });

}
