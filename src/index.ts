import { Hono } from 'hono';
import { PrismaClient } from '@prisma/client/edge';
import { withAccelerate } from '@prisma/extension-accelerate';
import { decode, sign, verify } from 'hono/jwt';

const app = new Hono<{
	Bindings: {
		DATABASE_URL: string;
		JWT_SECRET: string;
	};
	Variables: {
		userId: string;
	};
}>();

app.use('/api/v1/blog/*', async (c, next) => {
	const header = c.req.header('authorization') || '';
	const token = header.split(' ')[1];
	const response = await verify(token, c.env.JWT_SECRET);
	if (response.id) {
		next();
	} else {
		c.status(403);
		return c.json({ error: 'unauthorized' });
	}
});

app.get('/', (c) => {
	return c.text('welcome to the blog!');
});

app.post('/api/v1/user/signup', async (c) => {
	const prisma = new PrismaClient({
		datasourceUrl: c.env.DATABASE_URL,
	}).$extends(withAccelerate());

	const body = await c.req.json();
	try {
		const user = await prisma.user.create({
			data: {
				email: body.email,
				password: body.password,
			},
		});

		return c.text('jwt here');
	} catch (e) {
		return c.status(403);
	}
});

app.post('/api/v1/user/signin', async (c) => {
	const prisma = new PrismaClient({
		datasourceUrl: c.env?.DATABASE_URL,
	}).$extends(withAccelerate());

	const body = await c.req.json();
	try {
		const user = await prisma.user.findUnique({
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
		//@ts-ignore
		const jwt = await sign({ id: user.id }, c.env.JWT_SECRET);
	} catch (error) {
		c.status(403);
		return c.json({
			error: 'error while signing up',
		});
	}
	return c.text('signin route');
});

app.post('/api/v1/blog', async (c) => {
	return c.text('post blog');
});

app.put('/api/v1/blog', async (c) => {
	return c.text('put route');
});

app.get('/api/v1/blog/:id', async (c) => {
	const { id } = c.req.param();
	return c.text(`get blog id : ${id}`);
});

app.get('/api/v1/blog/bulk', async (c) => {
	return c.text('list bulk');
});

export default app;
