import { PrismaClient } from '@prisma/client/edge';
import { withAccelerate } from '@prisma/extension-accelerate';
import { Hono } from 'hono';
import { decode, sign, verify } from 'hono/jwt';
import { createBlogInput, updateBlogInput } from '@ritweek_kumar/blog-common';

export const blogRoute = new Hono<{
	Bindings: {
		DATABASE_URL: string;
		JWT_SECRET: string;
	};
	Variables: {
		authorId: string;
	};
}>();

blogRoute.use('/*', async (c, next) => {
	const token = c.req.header('authorization') || '';
	const response = await verify(token, c.env.JWT_SECRET);

	try {
		if (response.id) {
			c.set('authorId', response.id);
			await next();
		} else {
			c.status(403);
			return c.json({ error: 'unauthorized' });
		}
	} catch (error) {
		c.status(403);
		return c.json({ error: 'unauthorized' });
	}
});

blogRoute.post('/', async (c) => {
	const prisma = new PrismaClient({
		datasourceUrl: c.env.DATABASE_URL,
	}).$extends(withAccelerate());
	const body = await c.req.json();
	const authorId = c.get('authorId');
	const { success } = createBlogInput.safeParse(body);
	if (success) {
		try {
			const blog = await prisma.post.create({
				data: {
					title: body.title,
					content: body.content,
					published: body.published,
					authorId: authorId,
				},
			});
			return c.json({
				message: 'blog created',
				blog: blog,
			});
		} catch (error) {
			c.status(403);
			return c.text('failed to add blog');
		}
	} else {
		c.status(403);
		return c.text('invalid input');
	}
});

blogRoute.put('/', async (c) => {
	const prisma = new PrismaClient({
		datasourceUrl: c.env.DATABASE_URL,
	}).$extends(withAccelerate());

	const body = await c.req.json();
	const { success } = updateBlogInput.safeParse(body);

	if (success) {
		try {
			await prisma.post.update({
				where: {
					id: body.id,
				},
				data: {
					title: body.title,
					content: body.content,
				},
			});
		} catch (error) {
			c.status(403);
			return c.text('failed to update blog');
		}
	} else {
		c.status(403);
		return c.text('invalid input');
	}
});

blogRoute.get('/bulk', async (c) => {
	const prisma = new PrismaClient({
		datasourceUrl: c.env.DATABASE_URL,
	}).$extends(withAccelerate());

	try {
		const blogs = await prisma.post.findMany();
		return c.json({
			blogs: blogs,
		});
	} catch (error) {
		c.status(411);
		return c.json({
			message: 'Error while fetching the blog',
		});
	}
});

blogRoute.get('/:id', async (c) => {
	const prisma = new PrismaClient({
		datasourceUrl: c.env.DATABASE_URL,
	}).$extends(withAccelerate());
	const { id } = c.req.param();

	try {
		const blog = await prisma.post.findFirst({
			where: {
				id: id,
			},
		});

		if (blog) {
			return c.json({
				blog: blog,
			});
		} else {
			return c.json({
				message: 'No blog found!',
			});
		}
	} catch (error) {
		c.status(411);
		return c.json({
			message: 'Error while fetching the blog',
		});
	}
});
