import { createDisk, TOTAL_BLOCKS } from "./core/disk.js";

export const state = {
  disk: createDisk(TOTAL_BLOCKS),
  allocatedFiles: [],
  selectedBlockId: null
};

export function resetDiskState() {
  state.disk = createDisk(TOTAL_BLOCKS);
  state.allocatedFiles = [];
  state.selectedBlockId = null;
}
