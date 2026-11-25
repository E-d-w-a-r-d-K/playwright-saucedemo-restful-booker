import { expect, test } from '../../src/fixtures/api';
import { area, EPIC } from '../../src/utils/report';

test.describe('Health check', area(EPIC.api, 'Health check'), () => {
  // restful-booker documents "HTTP/1.1 201 Created" for GET /ping (the same deviation as API-NOTE-1).
  test('GET /ping answers 201 Created', async ({ client }) => {
    // Act
    const response = await client.ping();

    // Assert
    expect(response.status(), 'GET /ping answers 201').toBe(201);
    expect(await response.text(), 'the body is "Created"').toBe('Created');
  });
});
