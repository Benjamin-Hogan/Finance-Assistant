import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Divider,
  Chip,
  Paper,
  Snackbar,
  Alert,
  InputAdornment,
  Tooltip,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Cancel as CancelIcon,
} from "@mui/icons-material";

const Categories = ({ apiService }) => {
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [subcategoryDialogOpen, setSubcategoryDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [currentCategory, setCurrentCategory] = useState({
    name: "",
    color: "#9E9E9E",
    subcategories: [],
  });

  const [currentSubcategory, setCurrentSubcategory] = useState({
    name: "",
    categoryId: null,
  });

  const [editMode, setEditMode] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isDeleteSubcategory, setIsDeleteSubcategory] = useState(false);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    fetchCategories();
  }, [apiService]);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const data = await apiService.getCategories();
      setCategories(data);
    } catch (error) {
      console.error("Error fetching categories:", error);
      setSnackbar({
        open: true,
        message: "Failed to load categories",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (category = null) => {
    if (category) {
      setCurrentCategory({
        ...category,
        subcategories: category.subcategories.map((sc) => sc.name),
      });
      setEditMode(true);
    } else {
      setCurrentCategory({
        name: "",
        color: "#9E9E9E",
        subcategories: [],
      });
      setEditMode(false);
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  const handleOpenSubcategoryDialog = (categoryId) => {
    setCurrentSubcategory({
      name: "",
      categoryId,
    });
    setSubcategoryDialogOpen(true);
  };

  const handleCloseSubcategoryDialog = () => {
    setSubcategoryDialogOpen(false);
  };

  const handleOpenDeleteDialog = (
    id,
    isSubcategory = false,
    categoryId = null
  ) => {
    setItemToDelete({ id, categoryId });
    setIsDeleteSubcategory(isSubcategory);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentCategory((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubcategoryInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentSubcategory((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveCategory = async () => {
    try {
      if (editMode) {
        await apiService.updateCategory(currentCategory.id, {
          name: currentCategory.name,
          color: currentCategory.color,
        });

        setSnackbar({
          open: true,
          message: "Category updated successfully",
          severity: "success",
        });
      } else {
        await apiService.createCategory(currentCategory);
        setSnackbar({
          open: true,
          message: "Category created successfully",
          severity: "success",
        });
      }
      fetchCategories();
      handleCloseDialog();
    } catch (error) {
      console.error("Error saving category:", error);
      setSnackbar({
        open: true,
        message: "Failed to save category",
        severity: "error",
      });
    }
  };

  const handleSaveSubcategory = async () => {
    try {
      await apiService.addSubcategory(currentSubcategory.categoryId, {
        name: currentSubcategory.name,
      });

      setSnackbar({
        open: true,
        message: "Subcategory added successfully",
        severity: "success",
      });

      fetchCategories();
      handleCloseSubcategoryDialog();
    } catch (error) {
      console.error("Error adding subcategory:", error);
      setSnackbar({
        open: true,
        message: "Failed to add subcategory",
        severity: "error",
      });
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;

    try {
      if (isDeleteSubcategory) {
        // Delete subcategory
        await apiService.deleteCategory(itemToDelete.id);
        setSnackbar({
          open: true,
          message: "Subcategory deleted successfully",
          severity: "success",
        });
      } else {
        // Delete main category
        await apiService.deleteCategory(itemToDelete.id);
        setSnackbar({
          open: true,
          message: "Category deleted successfully",
          severity: "success",
        });
      }
      fetchCategories();
    } catch (error) {
      console.error("Error deleting:", error);
      setSnackbar({
        open: true,
        message: error.response?.data?.error || "Failed to delete",
        severity: "error",
      });
    } finally {
      handleCloseDeleteDialog();
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const addSubcategoryField = () => {
    setCurrentCategory((prev) => ({
      ...prev,
      subcategories: [...prev.subcategories, ""],
    }));
  };

  const removeSubcategoryField = (index) => {
    setCurrentCategory((prev) => ({
      ...prev,
      subcategories: prev.subcategories.filter((_, i) => i !== index),
    }));
  };

  const handleSubcategoryChange = (index, value) => {
    setCurrentCategory((prev) => {
      const updatedSubcategories = [...prev.subcategories];
      updatedSubcategories[index] = value;
      return {
        ...prev,
        subcategories: updatedSubcategories,
      };
    });
  };

  if (loading) {
    return <LinearProgress />;
  }

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4">Categories</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Category
        </Button>
      </Box>

      <Grid container spacing={3}>
        {categories.length === 0 ? (
          <Grid item xs={12}>
            <Card>
              <CardContent sx={{ textAlign: "center", py: 4 }}>
                <Typography variant="h6" gutterBottom>
                  No Categories Found
                </Typography>
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ mb: 3 }}
                >
                  Create your first category to organize your transactions and
                  budgets
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenDialog()}
                >
                  Add Category
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ) : (
          categories.map((category) => (
            <Grid item xs={12} md={6} lg={4} key={category.id}>
              <Paper
                sx={{
                  p: 2,
                  borderTop: 5,
                  borderColor: category.color || "primary.main",
                  height: "100%",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 2,
                  }}
                >
                  <Typography variant="h6">{category.name}</Typography>
                  <Box>
                    <Tooltip title="Edit Category">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(category)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Category">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDeleteDialog(category.id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>

                <Divider sx={{ my: 1 }} />

                <Box sx={{ mt: 2 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 1,
                    }}
                  >
                    <Typography variant="subtitle2">Subcategories</Typography>
                    <Button
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={() => handleOpenSubcategoryDialog(category.id)}
                    >
                      Add
                    </Button>
                  </Box>

                  {category.subcategories.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No subcategories yet
                    </Typography>
                  ) : (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                      {category.subcategories.map((subcategory) => (
                        <Chip
                          key={subcategory.id}
                          label={subcategory.name}
                          size="small"
                          onDelete={() =>
                            handleOpenDeleteDialog(
                              subcategory.id,
                              true,
                              category.id
                            )
                          }
                        />
                      ))}
                    </Box>
                  )}
                </Box>
              </Paper>
            </Grid>
          ))
        )}
      </Grid>

      {/* Add/Edit Category Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editMode ? "Edit Category" : "Add New Category"}
        </DialogTitle>
        <DialogContent>
          <TextField
            name="name"
            label="Category Name"
            fullWidth
            margin="normal"
            value={currentCategory.name}
            onChange={handleInputChange}
            required
          />

          <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
            Select Category Color
          </Typography>

          <Paper
            variant="outlined"
            sx={{
              p: 2,
              mb: 2,
              borderRadius: 1,
            }}
          >
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 1,
                justifyContent: "center",
              }}
            >
              {[
                "#F44336", // Red
                "#E91E63", // Pink
                "#9C27B0", // Purple
                "#673AB7", // Deep Purple
                "#3F51B5", // Indigo
                "#2196F3", // Blue
                "#03A9F4", // Light Blue
                "#00BCD4", // Cyan
                "#009688", // Teal
                "#4CAF50", // Green
                "#8BC34A", // Light Green
                "#CDDC39", // Lime
                "#FFEB3B", // Yellow
                "#FFC107", // Amber
                "#FF9800", // Orange
                "#FF5722", // Deep Orange
                "#795548", // Brown
                "#9E9E9E", // Grey
                "#607D8B", // Blue Grey
              ].map((color) => (
                <Tooltip key={color} title={color} arrow>
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      bgcolor: color,
                      borderRadius: "50%",
                      cursor: "pointer",
                      border:
                        currentCategory.color === color
                          ? "3px solid #000"
                          : "1px solid rgba(0,0,0,0.12)",
                      boxShadow: currentCategory.color === color ? 3 : 0,
                      transition: "all 0.2s",
                      "&:hover": {
                        transform: "scale(1.1)",
                      },
                    }}
                    onClick={() =>
                      setCurrentCategory((prev) => ({ ...prev, color }))
                    }
                  />
                </Tooltip>
              ))}
            </Box>

            <Box
              sx={{
                mt: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                Current Selection:
              </Typography>
              <Box
                sx={{
                  display: "inline-block",
                  width: 20,
                  height: 20,
                  borderRadius: 1,
                  bgcolor: currentCategory.color,
                  border: "1px solid rgba(0,0,0,0.12)",
                  mr: 1,
                }}
              />
              <Typography variant="body2" color="text.secondary">
                {currentCategory.color}
              </Typography>
            </Box>
          </Paper>

          {!editMode && (
            <Box sx={{ mt: 3 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 1,
                }}
              >
                <Typography variant="subtitle1">
                  Subcategories (Optional)
                </Typography>
                <Button
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={addSubcategoryField}
                >
                  Add
                </Button>
              </Box>

              {currentCategory.subcategories.map((subcategory, index) => (
                <Box key={index} sx={{ display: "flex", mb: 1 }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Subcategory name"
                    value={subcategory}
                    onChange={(e) =>
                      handleSubcategoryChange(index, e.target.value)
                    }
                  />
                  <IconButton onClick={() => removeSubcategoryField(index)}>
                    <CancelIcon />
                  </IconButton>
                </Box>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSaveCategory}
            variant="contained"
            disabled={!currentCategory.name}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Subcategory Dialog */}
      <Dialog
        open={subcategoryDialogOpen}
        onClose={handleCloseSubcategoryDialog}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Add Subcategory</DialogTitle>
        <DialogContent>
          <TextField
            name="name"
            label="Subcategory Name"
            fullWidth
            margin="normal"
            value={currentSubcategory.name}
            onChange={handleSubcategoryInputChange}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSubcategoryDialog}>Cancel</Button>
          <Button
            onClick={handleSaveSubcategory}
            variant="contained"
            disabled={!currentSubcategory.name}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            {isDeleteSubcategory
              ? "Are you sure you want to delete this subcategory?"
              : "Are you sure you want to delete this category and all its subcategories? This action cannot be undone and will fail if the category is being used in transactions or budgets."}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <Button onClick={handleDelete} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Categories;
