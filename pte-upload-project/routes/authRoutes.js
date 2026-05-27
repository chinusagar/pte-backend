const express = require("express");
const router = express.Router();

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");

/*
REGISTER
*/

router.post("/register", async (req, res) => {

    try {

        const { name, email, password } =
            req.body;

        const hashedPassword =
            await bcrypt.hash(password, 10);

        const user = await User.create({

            name,
            email,
            password: hashedPassword

        });

        res.json({

            success: true,
            user

        });

    } catch (error) {

        res.status(500).json({

            success: false,
            error: error.message

        });

    }

});

/*
LOGIN
*/

router.post("/login", async (req, res) => {

    try {

        const { email, password } =
            req.body;

        const user =
            await User.findOne({ email });

        if (!user) {

            return res.json({

                success: false,
                message: "User not found"

            });

        }

        const isMatch =
            await bcrypt.compare(

                password,
                user.password

            );

        if (!isMatch) {

            return res.json({

                success: false,
                message: "Invalid password"

            });

        }

        const token = jwt.sign(
            { id: user._id },
            "secretkey",
            { expiresIn: "1d" }
        );

        res.json({

            success: true,
            token,
            user

        });

    } catch (error) {

        res.status(500).json({

            success: false,
            error: error.message

        });

    }

});

module.exports = router;