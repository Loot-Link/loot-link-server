import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import app from "#app";
import db from "#db/client";

beforeAll(async () => {
  await db.connect();
  await db.query("BEGIN");
});
afterAll(async () => {
  await db.query("ROLLBACK");
  await db.end();
});

describe("POST /users/register", () => {
  it("sends 400 if request body is invalid", async () => {
    await db.query("SAVEPOINT s");
    const response = await request(app).post("/users/register").send({});
    expect(response.status).toBe(400);
    await db.query("ROLLBACK TO s");
  });

  it("creates a new user with a hashed password and sends a token", async () => {
    const response = await request(app).post("/users/register").send({
      username: "eFa7xWeIF5A3cpF5JrM1UzsI",
      password: "password123",
    });

    const {
      rows: [user],
    } = await db.query(
      "SELECT * FROM users WHERE username = 'eFa7xWeIF5A3cpF5JrM1UzsI'",
    );
    expect(user).toBeDefined();
    expect(user).toHaveProperty("password");
    expect(user.password).not.toBe("password123");

    expect(response.status).toBe(201);
    expect(response.text).toMatch(/\w+\.\w+\.\w+/);
  });
});

describe("Protected routes", () => {
  let token;

  const newPlaylist = {
    name: "My playlist",
    description: "My description",
  };

  let newPlaylistUrl;

  describe("POST /users/login", () => {
    it("sends 400 if request body is invalid", async () => {
      await db.query("SAVEPOINT s");
      const response = await request(app).post("/users/login").send({});
      expect(response.status).toBe(400);
      await db.query("ROLLBACK TO s");
    });

    it("sends a token if credentials are valid", async () => {
      const response = await request(app).post("/users/login").send({
        username: "eFa7xWeIF5A3cpF5JrM1UzsI",
        password: "password123",
      });
      expect(response.status).toBe(200);

      token = response.text;

      expect(token).toBeDefined();
      expect(token).toMatch(/\w+\.\w+\.\w+/);
    });
  });

  describe("POST /playlists", () => {
    it("sends 401 if user is not authenticated", async () => {
      const response = await request(app).post("/playlists").send(newPlaylist);
      expect(response.status).toBe(401);
    });

    it("creates a new playlist owned by the user", async () => {
      const response = await request(app)
        .post("/playlists")
        .set("Authorization", `Bearer ${token}`)
        .send(newPlaylist);
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("id");
      newPlaylist.id = response.body.id;
      newPlaylistUrl = `/playlists/${newPlaylist.id}/tracks`;
    });
  });

  describe("GET /playlists", () => {
    it("sends 401 if user is not authenticated", async () => {
      const response = await request(app).get("/playlists");
      expect(response.status).toBe(401);
    });

    it("sends playlists owned by the user", async () => {
      const response = await request(app)
        .get("/playlists")
        .set("Authorization", `Bearer ${token}`);
      expect(response.status).toBe(200);
      expect(response.body).toEqual(
        expect.arrayContaining([expect.objectContaining(newPlaylist)]),
      );
    });
  });

  describe("GET /playlists/:id", () => {
    it("sends 401 if user is not authenticated", async () => {
      const response = await request(app).get("/playlists/1");
      expect(response.status).toBe(401);
    });

    it("sends 403 if user does not own the playlist", async () => {
      const response = await request(app)
        .get("/playlists/1")
        .set("Authorization", `Bearer ${token}`);
      expect(response.status).toBe(403);
    });
  });

  describe("POST /playlists/:id/tracks", () => {
    it("sends 401 if user is not authenticated", async () => {
      const response = await request(app)
        .post(newPlaylistUrl)
        .send({ trackId: 1 });
      expect(response.status).toBe(401);
    });

    it("sends 403 if user does not own the playlist", async () => {
      const response = await request(app)
        .post("/playlists/1/tracks")
        .send({ trackId: 1 })
        .set("Authorization", `Bearer ${token}`);
      expect(response.status).toBe(403);
    });

    it("adds a track to the playlist", async () => {
      const response = await request(app)
        .post(newPlaylistUrl)
        .send({ trackId: 1 })
        .set("Authorization", `Bearer ${token}`);
      expect(response.status).toBe(201);
    });
  });

  describe("GET /playlists/:id/tracks", () => {
    it("sends 401 if user is not authenticated", async () => {
      const response = await request(app).get(newPlaylistUrl);
      expect(response.status).toBe(401);
    });

    it("sends 403 if user does not own the playlist", async () => {
      const response = await request(app)
        .get("/playlists/1/tracks")
        .set("Authorization", `Bearer ${token}`);
      expect(response.status).toBe(403);
    });
  });

  describe("GET /tracks/:id/playlists", () => {
    it("sends 401 if user is not authenticated", async () => {
      const response = await request(app).get("/tracks/1/playlists");
      expect(response.status).toBe(401);
    });

    it("sends 404 if track does not exist", async () => {
      const response = await request(app)
        .get("/tracks/999/playlists")
        .set("Authorization", `Bearer ${token}`);
      expect(response.status).toBe(404);
    });

    it("sends playlists owned by the user that contain the track", async () => {
      const response = await request(app)
        .get("/tracks/1/playlists")
        .set("Authorization", `Bearer ${token}`);
      expect(response.status).toBe(200);
      expect(response.body).toEqual(
        expect.arrayContaining([expect.objectContaining(newPlaylist)]),
      );
    });
  });
});
