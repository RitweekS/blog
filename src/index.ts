import { Hono } from 'hono';

import { userRoute } from './router/user';
import { blogRoute } from './router/blog';

const app = new Hono<{
	Bindings: {
		DATABASE_URL: string;
		JWT_SECRET: string;
	};
	Variables: {
		userId: string;
	};
}>();

app.get('/', (c) => {
	return c.html('<h1>welcome to the blog!</h1>');
});

app.route('/api/v1/user', userRoute);
app.route('/api/v1/blog', blogRoute);

export default app;
