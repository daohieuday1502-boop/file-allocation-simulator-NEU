
import { getFreeBlocks } from "../core/disk.js";

export function allocateLinked(file, disk) {
  const needed = file.requiredDataBlocks;
  const freeBlocks = getFreeBlocks(disk);

  if (freeBlocks.length < needed) {
    return {
      success: false,
      message: "Linked Allocation failed: not enough free blocks."
    };
  }

  // Chon cac block trai deu tren danh sach block trong
  const selected = [];

  for (let i = 0; i < needed; i++) {
    const index = Math.floor(
      (i + 0.5) * freeBlocks.length / needed
    );
    selected.push(freeBlocks[index]);
  }

  // Danh dau va noi cac block voi nhau
  selected.forEach((block, i) => {
    block.status = "USED";
    block.fileId = file.id;
    block.kind = "DATA";

    block.nextBlock =
      i < selected.length - 1
        ? selected[i + 1].id
        : null;
  });

  file.allocationMethod = "LINKED";
  file.startBlock = selected[0]?.id ?? null;
  file.endBlock = selected[selected.length - 1]?.id ?? null;
  file.dataBlocks = selected.map(block => block.id);

  return {
    success: true,
    message: `Allocated ${needed} linked data blocks.`
  };
}
