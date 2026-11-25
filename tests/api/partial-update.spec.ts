import { expect, test } from '../../src/fixtures/api';
import { FORGED_TOKEN, newBooking, PARTIAL_CHANGE } from '../../src/data/booking';
import { area, EPIC } from '../../src/utils/report';

test.describe('Partial update', area(EPIC.api, 'Partial update (PATCH)'), () => {
  test('PATCH with a token changes only the sent fields', async ({ client, token, cleanup }) => {
    // Arrange
    const booking = newBooking();
    const id = await client.createId(booking);
    cleanup(id);
    const expected = { ...booking, ...PARTIAL_CHANGE };

    // Act
    const response = await client.partialUpdate(id, PARTIAL_CHANGE, token);

    // Assert: the sent fields changed, every other field is exactly as created
    expect(response.status(), 'PATCH answers 200').toBe(200);
    expect(await response.json(), 'PATCH returns the whole booking with the change applied').toEqual(expected);
    expect(await (await client.get(id)).json(), 'GET returns the same').toEqual(expected);
  });

  const unauthorised = [
    { label: 'without a token', token: undefined },
    { label: 'with a forged token', token: FORGED_TOKEN },
  ];
  for (const { label, token } of unauthorised) {
    test(`PATCH ${label} is forbidden and changes nothing`, async ({ client, cleanup }) => {
      // Arrange
      const booking = newBooking();
      const id = await client.createId(booking);
      cleanup(id);

      // Act
      const response = await client.partialUpdate(id, PARTIAL_CHANGE, token);

      // Assert
      expect(response.status(), `PATCH ${label} answers 403`).toBe(403);
      expect(await (await client.get(id)).json(), 'the stored booking is unchanged').toEqual(booking);
    });
  }
});
