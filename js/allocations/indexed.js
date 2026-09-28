// Indexed Allocation algorithm
import { getFreeBlocks } from "../core/disk.js";

export function allocateLinked(file, disk) {
  const needed = file.requiredDataBlocks;

  const freeBlocks = getFreeBlocks(disk);

  if (freeBlocks.length < needed) {
    return {
      success: false,
      message:
        "Linked Allocation failed: not enough free blocks."
    };
  }

  const selectedBlocks = freeBlocks.slice(0, needed);

  selectedBlocks.forEach((block, index) => {
    block.status = "USED";
    block.fileId = file.id;
    block.kind = "DATA";

    if (index < selectedBlocks.length - 1) {
      block.nextBlock = selectedBlocks[index + 1].id;
    } else {
      block.nextBlock = null;
    }
  });

  file.allocationMethod = "LINKED";
  file.startBlock = selectedBlocks[0].id;
  file.endBlock = selectedBlocks[selectedBlocks.length - 1].id;

  file.dataBlocks = selectedBlocks.map((block) => block.id);

  return {
    success: true,
    message: `Allocated ${needed} linked data blocks.`
  };
}
