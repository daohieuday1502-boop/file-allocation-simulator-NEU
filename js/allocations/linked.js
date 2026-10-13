import {
  getFreeBlocks
} from "../core/disk.js";


export function allocateLinked(
  file,
  disk,
  requirement
) {

  const needed =
    requirement.requiredDataBlocks;


  const freeBlocks =
    getFreeBlocks(disk);


  if (
    freeBlocks.length < needed
  ) {

    return {

      success: false,

      method: "LINKED",

      requiredBlocks:
        needed,

      freeBlocks:
        freeBlocks.length,

      message:
        "Not enough free blocks."

    };

  }


  /*
    Linked Allocation does not
    REQUIRE consecutive blocks.

    The simulator simply uses
    available blocks supplied by
    the free-space list.
  */

  const selectedBlocks =
    freeBlocks.slice(
      0,
      needed
    );


  selectedBlocks.forEach(
    (block, position) => {

      block.status = "USED";

      block.fileId =
        file.id;

      block.allocationMethod =
        "LINKED";

      block.kind = "DATA";


      if (
        position <
        selectedBlocks.length - 1
      ) {

        block.nextBlock =
          selectedBlocks[
            position + 1
          ].id;

      }

      else {

        block.nextBlock = null;

      }

    }
  );


  file.allocationMethod =
    "LINKED";

  file.requiredDataBlocks =
    needed;

  file.totalPhysicalBlocks =
    requirement.totalPhysicalBlocks;

  file.usableBytesPerDataBlock =
    requirement.usableBytesPerDataBlock;

  file.startBlock =
    selectedBlocks[0].id;

  file.endBlock =
    selectedBlocks[
      selectedBlocks.length - 1
    ].id;

  file.dataBlocks =
    selectedBlocks.map(
      (block) => block.id
    );


  return {

    success: true,

    method: "LINKED",

    allocatedBlocks:
      file.dataBlocks,

    message:
      "Linked allocation completed successfully."

  };

}
