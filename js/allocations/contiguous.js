import {
  countFreeBlocks,
  getLargestFreeBlockSequence
} from "../core/disk.js";


export function allocateContiguous(
  file,
  disk,
  requirement
) {

  const needed =
    requirement.requiredDataBlocks;


  const totalFreeBlocks =
    countFreeBlocks(disk);


  const largestRegion =
    getLargestFreeBlockSequence(
      disk
    );


  /*
    Fail if no sufficiently large
    consecutive FREE region exists
  */

  if (
    largestRegion < needed
  ) {

    return {

      success: false,

      method: "CONTIGUOUS",

      requiredBlocks:
        needed,

      freeBlocks:
        totalFreeBlocks,

      largestFreeBlockSequence:
        largestRegion

    };

  }


  let runStart = -1;

  let runLength = 0;


  /*
    Find first sufficiently large
    consecutive FREE region
  */

  for (
    let i = 0;
    i < disk.length;
    i++
  ) {

    if (
      disk[i].status === "FREE"
    ) {

      if (
        runLength === 0
      ) {

        runStart = i;

      }


      runLength++;


      if (
        runLength === needed
      ) {

        break;

      }

    }

    else {

      runStart = -1;

      runLength = 0;

    }

  }


  const allocatedBlocks = [];


  /*
    Allocate blocks
  */

  for (
    let i = runStart;
    i < runStart + needed;
    i++
  ) {

    disk[i].status =
      "USED";

    disk[i].fileId =
      file.id;

    disk[i].allocationMethod =
      "CONTIGUOUS";

    disk[i].kind =
      "DATA";

    disk[i].nextBlock =
      null;

    disk[i].indexEntries =
      [];


    allocatedBlocks.push(i);

  }


  /*
    Update file metadata
  */

  file.allocationMethod =
    "CONTIGUOUS";

  file.requiredDataBlocks =
    needed;

  file.totalPhysicalBlocks =
    requirement.totalPhysicalBlocks;

  file.usableBytesPerDataBlock =
    requirement.usableBytesPerDataBlock;

  file.startBlock =
    runStart;

  file.endBlock =
    runStart + needed - 1;

  file.indexBlock =
    null;

  file.dataBlocks =
    allocatedBlocks;


  return {

    success: true,

    method: "CONTIGUOUS",

    allocatedBlocks:
      allocatedBlocks

  };

}
