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

      reason:
        "Not enough free blocks are available."

    };

  }


  /*
    For better visualization,
    do not always choose blocks
    immediately next to each other.

    We first take alternating
    free blocks when possible.
  */

  const selectedBlocks = [];

  let index = 0;


  while (
    selectedBlocks.length < needed &&
    index < freeBlocks.length
  ) {

    selectedBlocks.push(
      freeBlocks[index]
    );

    index += 2;

  }


  /*
    If alternating blocks were
    not enough, fill from the
    remaining FREE blocks.
  */

  if (
    selectedBlocks.length < needed
  ) {

    for (
      let i = 0;
      i < freeBlocks.length;
      i++
    ) {

      const block =
        freeBlocks[i];


      if (
        !selectedBlocks.includes(
          block
        )
      ) {

        selectedBlocks.push(
          block
        );

      }


      if (
        selectedBlocks.length ===
        needed
      ) {

        break;

      }

    }

  }


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

      } else {

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
