const express = require('express');
const bcrypt = require('bcryptjs');
const { verifyToken } = require('../middleware/auth.middleware');

const router = express.Router();

// Helper: Hash Password
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

// Get User Profile
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user is requesting their own profile
    if (req.user.userId !== id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Cannot access other user profiles'
      });
    }

    const { data: user, error } = await req.supabase
      .from('users')
      .select('id, email, full_name, role, created_at, updated_at')
      .eq('id', id)
      .single();

    if (error || !user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Update User Profile
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, password } = req.body;

    // Check if user is updating their own profile
    if (req.user.userId !== id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Cannot update other user profiles'
      });
    }

    // Prepare update object
    const updateData = {
      updated_at: new Date()
    };

    if (fullName) {
      updateData.full_name = fullName;
    }

    if (password) {
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters long'
        });
      }
      updateData.password = await hashPassword(password);
    }

    const { data: updatedUser, error } = await req.supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        success: false,
        message: 'Error updating user',
        error: error.message
      });
    }

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        fullName: updatedUser.full_name,
        role: updatedUser.role
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Delete User Account
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user is deleting their own account
    if (req.user.userId !== id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Cannot delete other user accounts'
      });
    }

    const { error } = await req.supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(500).json({
        success: false,
        message: 'Error deleting user',
        error: error.message
      });
    }

    res.status(200).json({
      success: true,
      message: 'User account deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

module.exports = router;
