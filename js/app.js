// Main application controller
console.log("File Allocation Simulator loaded successfully.");
import { createDisk } from "./core/disk.js";
console.log("File Allocation Simulator loaded successfully.");
const disk = createDisk(20);
console.log("Virtual Disk:", disk);

// chỗ này để tạo ra 20 ô trống trên "giao diện"
import { createDisk } from "./core/disk.js";
console.log("File Allocation Simulator loaded successfully.");
const disk = createDisk(20);
console.log("Virtual Disk:", disk);
const diskContainer = document.getElementById("disk-container");
disk.forEach((block) => {
  const blockElement = document.createElement("div");
  blockElement.className = "disk-block";
  blockElement.textContent = block.id;
  diskContainer.appendChild(blockElement);
});
