const express  = require("express");
const router   = express.Router();
const upload   = require("../middleware/upload");
const {
  getDocuments, getRecentDocuments, getFolders,
  uploadDocument, downloadDocument,
  updateDocument, deleteDocument, getDocumentStats,
} = require("../controllers/documentController");
const { protect, adminOnly } = require("../middleware/auth");

// Download is public-with-token — protect is handled inside controller
router.get("/:id/download", downloadDocument);

router.use(protect);

router.get("/stats",    adminOnly, getDocumentStats);
router.get("/recent",   getRecentDocuments);
router.get("/folders",  getFolders);
router.get("/",         getDocuments);
router.post("/upload",  upload.single("file"), uploadDocument);
router.put("/:id",      updateDocument);
router.delete("/:id",   deleteDocument);

module.exports = router;
