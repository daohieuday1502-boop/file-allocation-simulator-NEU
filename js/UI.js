import {
  BLOCK_SIZE_BYTES,
  POINTER_SIZE_BYTES,
  TOTAL_BLOCKS,
  getLargestFreeBlockSequence
} from "./core/disk.js";

import { TEST_FILES } from "./data.js";
import { state } from "./state.js";

export const dom = {
  fileSelect: document.getElementById("file-select"),
  fileInfo: document.getElementById("file-info"),
  storageRequirement: document.getElementById("storage-requirement"),
  allocateButton: document.getElementById("allocate-button"),
  fragmentButton: document.getElementById("fragment-button"),
  resetButton: document.getElementById("reset-button"),
  allocationResult: document.getElementById("allocation-result"),
  diskContainer: document.getElementById("disk-container"),
  diskStats: document.getElementById("disk-stats"),
  bitmap: document.getElementById("bitmap"),
  blockDetails: document.getElementById("block-details"),
  fcbPanel: document.getElementById("fcb-panel"),
  fileList: document.getElementById("file-list")
};

export function getSelectedFileDefinition() {
  return TEST_FILES.find((file) => file.id === dom.fileSelect.value);
}

export function getSelectedMethod() {
  const selected = document.querySelector('input[name="allocation-method"]:checked');
  return selected ? selected.value : "CONTIGUOUS";
}

export function populateFileSelect() {
  dom.fileSelect.innerHTML = "";

  TEST_FILES.forEach((file) => {
    const option = document.createElement("option");
    option.value = file.id;
    option.textContent = `${file.name} (${file.sizeBytes} bytes)`;
    dom.fileSelect.appendChild(option);
  });
}

export function showSelectedFileInfo() {
  const definition = getSelectedFileDefinition();

  if (!definition) {
    dom.fileInfo.textContent = "No file selected.";
    return;
  }

  dom.fileInfo.textContent = `File ID: ${definition.id}
File name: ${definition.name}
File size: ${definition.sizeBytes} bytes`;
}

export function getRequirementSummaryText(method, requirement, fileSize) {
  let text = `Method: ${method}
File size: ${fileSize} bytes
Block size: ${BLOCK_SIZE_BYTES} bytes`;

  if (method === "CONTIGUOUS") {
    text += `
Usable data/block: ${BLOCK_SIZE_BYTES} bytes
Data blocks required: ${requirement.requiredDataBlocks}
Physical blocks required: ${requirement.totalPhysicalBlocks}`;
    return text;
  }

  if (method === "LINKED") {
    text += `
Pointer size: ${POINTER_SIZE_BYTES} bytes
Usable data/block: ${requirement.usableBytesPerDataBlock} bytes
Data blocks required: ${requirement.requiredDataBlocks}
Physical blocks required: ${requirement.totalPhysicalBlocks}`;
    return text;
  }

  text += `
Data blocks required: ${requirement.requiredDataBlocks}
Index blocks required: ${requirement.indexBlocks}
Physical blocks required: ${requirement.totalPhysicalBlocks}`;
  return text;
}

export function showStorageRequirement(file, method, requirement) {
  dom.storageRequirement.textContent = getRequirementSummaryText(
    method,
    requirement,
    file.sizeBytes
  );
}

export function showSimpleFailure(text) {
  dom.allocationResult.className = "result-box result-fail";
  dom.allocationResult.textContent = `ALLOCATION FAILED
${text}`;
}

export function showAllocationResult(result, file, requirement) {
  dom.allocationResult.className = "result-box";

  if (result.success) {
    dom.allocationResult.classList.add("result-success");
    dom.allocationResult.textContent = `ALLOCATION SUCCESS
File: ${file.name}
Method: ${result.method}
Data blocks: ${requirement.requiredDataBlocks}
Physical blocks used: ${requirement.totalPhysicalBlocks}`;
    return;
  }

  dom.allocationResult.classList.add("result-fail");
  let text = `ALLOCATION FAILED
File: ${file.name}
Method: ${result.method}`;

  if (result.method === "CONTIGUOUS") {
    text += `
Required blocks: ${result.requiredBlocks}
Free blocks: ${result.freeBlocks}
Largest free block sequence: ${result.largestFreeBlockSequence}
No suitable continuous free block sequence. Disk unchanged.`;
  }

  if (result.method === "LINKED") {
    text += `
Required blocks: ${result.requiredBlocks}
Free blocks: ${result.freeBlocks}
Not enough free blocks. Disk unchanged.`;
  }

  if (result.method === "INDEXED") {
    text += `
Data blocks required: ${result.requiredDataBlocks}
Index blocks required: ${result.indexBlocks}
Total blocks required: ${result.totalRequiredBlocks}
Free blocks: ${result.freeBlocks}
Not enough free blocks. Disk unchanged.`;
  }

  dom.allocationResult.textContent = text;
}

function getBlockClassName(block) {
  if (block.status !== "USED") {
    return "";
  }

  if (block.allocationMethod === "CONTIGUOUS") {
    return "block-contiguous";
  }

  if (block.allocationMethod === "LINKED") {
    return "block-linked";
  }

  if (block.allocationMethod === "INDEXED") {
    return block.kind === "INDEX" ? "block-index" : "block-indexed";
  }

  return "";
}

export function renderDisk() {
  dom.diskContainer.innerHTML = "";

  state.disk.forEach((block) => {
    const blockElement = document.createElement("div");
    blockElement.className = "disk-block";

    if (block.id === state.selectedBlockId) {
      blockElement.classList.add("selected");
    }

    const blockClass = getBlockClassName(block);
    if (blockClass) {
      blockElement.classList.add(blockClass);
    }

    const idLabel = document.createElement("span");
    idLabel.className = "block-id";
    idLabel.textContent = block.id;

    const ownerLabel = document.createElement("span");
    ownerLabel.className = "block-owner";
    ownerLabel.textContent = block.fileId ?? "FREE";

    blockElement.appendChild(idLabel);
    blockElement.appendChild(ownerLabel);
    blockElement.addEventListener("click", () => selectBlock(block.id));

    dom.diskContainer.appendChild(blockElement);
  });
}

export function renderDiskStats() {
  const used = state.disk.filter((block) => block.status === "USED").length;
  const free = TOTAL_BLOCKS - used;
  const largestSequence = getLargestFreeBlockSequence(state.disk);

  dom.diskStats.textContent = `Total blocks: ${TOTAL_BLOCKS}
Block size: ${BLOCK_SIZE_BYTES} bytes
Disk capacity: ${TOTAL_BLOCKS * BLOCK_SIZE_BYTES} bytes
Used blocks: ${used}
Free blocks: ${free}
Largest free block sequence: ${largestSequence} blocks`;
}

export function renderFreeSpaceBitmap() {
  const bits = state.disk.map((block) => (block.status === "FREE" ? "1" : "0"));
  const rows = [];

  for (let i = 0; i < bits.length; i += 20) {
    rows.push(bits.slice(i, i + 20).join(" "));
  }

  dom.bitmap.textContent = rows.join("\n");
}

export function renderFCB(file) {
  let text = `File ID: ${file.id}
File name: ${file.name}
File size: ${file.sizeBytes} bytes
Allocation method: ${file.allocationMethod}`;

  if (file.allocationMethod === "CONTIGUOUS") {
    text += `
Start block: ${file.startBlock}
Length: ${file.requiredDataBlocks} blocks`;
  }

  if (file.allocationMethod === "LINKED") {
    text += `
First block: ${file.startBlock}
Last block: ${file.endBlock}`;
  }

  if (file.allocationMethod === "INDEXED") {
    text += `
Index block: ${file.indexBlock}`;
  }

  dom.fcbPanel.textContent = text;
}

export function renderBlockDetails(block) {
  let text = `Block ID: ${block.id}
Status: ${block.status}`;

  if (block.status === "FREE") {
    dom.blockDetails.textContent = text;
    return;
  }

  const file = state.allocatedFiles.find((item) => item.id === block.fileId);

  text += `
File ID: ${block.fileId}
File name: ${file?.name ?? "Unknown"}
Block type: ${block.kind}
Method: ${block.allocationMethod}`;

  if (block.nextBlock !== null) {
    text += `
Next block: ${block.nextBlock}`;
  }

  if (block.kind === "INDEX") {
    text += `
Index entries: ${block.indexEntries.join(", ")}`;
  }

  dom.blockDetails.textContent = text;
}

export function renderFileList(onDelete = null) {
  dom.fileList.innerHTML = "";

  if (state.allocatedFiles.length === 0) {
    dom.fileList.textContent = "No files allocated yet.";
    return;
  }

  state.allocatedFiles.forEach((file) => {
    const row = document.createElement("div");
    row.className = "file-row";

    const text = document.createElement("div");
    text.className = "file-info-line";
    text.textContent = `${file.id} — ${file.name}
${file.allocationMethod} — ${file.totalPhysicalBlocks} block(s)`;

    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-button";
    deleteButton.textContent = "Delete";

    if (onDelete) {
      deleteButton.addEventListener("click", () => onDelete(file.id));
    }

    row.appendChild(text);
    row.appendChild(deleteButton);
    dom.fileList.appendChild(row);
  });
}

export function renderEverything(onDelete = null) {
  renderDisk();
  renderDiskStats();
  renderFreeSpaceBitmap();
  renderFileList(onDelete);
}

export function bindEvents({ onFileChange, onMethodChange, onAllocate, onFragment, onReset }) {
  dom.fileSelect.addEventListener("change", onFileChange);

  document.querySelectorAll('input[name="allocation-method"]').forEach((radio) => {
    radio.addEventListener("change", onMethodChange);
  });

  dom.allocateButton.addEventListener("click", onAllocate);
  dom.fragmentButton.addEventListener("click", onFragment);
  dom.resetButton.addEventListener("click", onReset);
}

export function selectBlock(blockId) {
  state.selectedBlockId = blockId;
  const block = state.disk[blockId];

  renderBlockDetails(block);

  if (block.fileId !== null) {
    const file = state.allocatedFiles.find((item) => item.id === block.fileId);
    if (file) {
      renderFCB(file);
    }
  } else {
    dom.fcbPanel.textContent = "This block is FREE and does not belong to a file.";
  }

  renderDisk();
}

export function setResultMessage(text) {
  dom.allocationResult.className = "result-box";
  dom.allocationResult.textContent = text;
}
