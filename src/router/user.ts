import { Hono } from 'hono';
import { PrismaClient } from '@prisma/client/edge';
import { withAccelerate } from '@prisma/extension-accelerate';
import { decode, sign, verify } from 'hono/jwt';
import { signupInput, signinInput } from '@ritweek_kumar/blog-common';
export const userRoute = new Hono<{
	Bindings: {
		DATABASE_URL: string;
		JWT_SECRET: string;
	};
	Variables: {
		userId: string;
	};
}>();

userRoute.post('/signup', async (c) => {
	const prisma = new PrismaClient({
		datasourceUrl: c.env.DATABASE_URL,
	}).$extends(withAccelerate());
	const body = await c.req.json();
	const { success } = signupInput.safeParse(body);
	if (success) {
		try {
			const user = await prisma.user.create({
				data: {
					email: body.email,
					password: body.password,
					username: body.username,
					name: body.name,
				},
			});

			const jwt = await sign(
				{
					id: user.id,
				},
				c.env.JWT_SECRET
			);
			return c.json({
				message: 'user created',
				token: jwt,
			});
		} catch (e) {
			c.status(403);
			return c.text('Invalid');
		}
	} else {
		c.status(403);
		return c.json({
			message: 'invalid input',
		});
	}
});

userRoute.post('/signin', async (c) => {
	const prisma = new PrismaClient({
		datasourceUrl: c.env?.DATABASE_URL,
	}).$extends(withAccelerate());

	const body = await c.req.json();
	const { success } = signinInput.safeParse(body);

	if (success) {
		try {
			const user = await prisma.user.findFirst({
				where: {
					email: body.email,
					password: body.password,
				},
			});

			if (!user) {
				c.status(403);
				return c.json({
					error: 'User Not Found',
				});
			}

			const jwt = await sign({ id: user.id }, c.env.JWT_SECRET);

			return c.json({
				token: jwt,
			});
		} catch (error) {
			c.status(403);
			return c.json({
				error: 'error while signing up',
			});
		}
	} else {
		c.status(403);
		return c.json({
			message: 'invalid input',
		});
	}
});
