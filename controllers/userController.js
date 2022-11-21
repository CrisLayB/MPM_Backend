/* eslint-disable no-undef */

const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const asyncHandler = require('express-async-handler')
const User = require('../models/userModel')

// @desc   Register new user
// @route  POST /api/users
// @access Public
const registerUser = asyncHandler(async(req, res) => {
    const {name, email, password} = req.body

    if(!name || !email || !password){
        res.status(400)
        throw new Error('Añada todos los campos')
    }

    //Checking if user exists
    const userExists = await User.findOne({email})
    if(userExists){
        res.status(400)
        throw new Error('El nombre de usuario ya existe')
    }

    //Hash password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    //Create user
    const user = await User.create({
        name, email, password: hashedPassword
    })

    if(user) {
        res.status(201).json({
            _id: user.id,
            name: user.name,
            email: user.email,
            token: generateToken(user._id)
        })
    } 
    else {
        res.status(400)
        throw new Error('Datox inválidos')
    }
})

// @desc   Authenticate a user
// @route  POST /api/users/login
// @access Public
const loginUser = asyncHandler( async(req, res) => {
    const {email, password} = req.body

    //Check for user email
    const user = await User.findOne({email})
    if(user && (await bcrypt.compare(password, user.password))) {
        res.json({
            _id: user.id,
            name: user.name,
            email: user.email,
            token: generateToken(user._id)
        })
    } else {
        res.status(400)
        throw new Error('Datos incorrectos')
    }
})

// @desc   Get user data
// @route  GET /api/users/me
// @access Private
const getMe = asyncHandler( async(req, res) => {
    const {_id, name, email} = await User.findById(req.user.id)
    
    res.status(200).json({
        id: _id,
        name,
        email,
    })
})

// Generate JWT token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    })
}

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private
const updateUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id)

    if (!user) {
        res.status(400)
        throw new Error('No se encontró al usuario')
    }

    const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
    })

    res.status(200).json(updatedUser)
})

// @desc    Delete user
// @route   DELETE /api/users:id
// @access  Private
const deleteUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id)

    if (!user) {
        res.status(400)
        throw new Error('No se encontró al usuario')
    }

    await user.remove()

    res.status(200).json({ messsge: 'Usuario borrado' })
})

module.exports = {
    registerUser,
    loginUser,
    getMe,
    updateUser,
    deleteUser
}