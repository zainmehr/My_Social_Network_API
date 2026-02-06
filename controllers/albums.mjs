import { z } from "zod";
import config from "../config.mjs";
import { validate } from "../middlewares/validate.mjs";
import { requireAuth } from "../middlewares/auth.mjs";
import AlbumSchema from "../models/album.mjs";

const createAlbumSchema = z.object({
  body: z.object({
    event: z.string().min(1),
    name: z.string().min(1)
  })
});

const addPhotoSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({ url: z.string().url() })
});

const commentPhotoSchema = z.object({
  params: z.object({ id: z.string().min(1), photoId: z.string().min(1) }),
  body: z.object({ text: z.string().min(1).max(1000) })
});

export default class Albums {
  constructor(app, connect) {
    this.app = app;
    this.connect = connect;

    this.Album = connect.model("Album", AlbumSchema);

    this.run();
  }

  run() {
    this.app.post(`${config.api.prefix}/albums`, requireAuth, validate(createAlbumSchema), (req, res, next) =>
      this.create(req, res, next)
    );

    this.app.get(`${config.api.prefix}/albums/:id`, requireAuth, (req, res, next) => this.get(req, res, next));

    this.app.post(
      `${config.api.prefix}/albums/:id/photos`,
      requireAuth,
      validate(addPhotoSchema),
      (req, res, next) => this.addPhoto(req, res, next)
    );

    this.app.post(
      `${config.api.prefix}/albums/:id/photos/:photoId/comments`,
      requireAuth,
      validate(commentPhotoSchema),
      (req, res, next) => this.comment(req, res, next)
    );
  }

  async create(req, res, next) {
    try {
      const { event, name } = req.validated.body;
      const album = await this.Album.create({ event, name, photos: [] });
      return res.status(201).json(album.toJSON());
    } catch (e) {
      return next(e);
    }
  }

  async get(req, res, next) {
    try {
      const album = await this.Album.findById(req.params.id);
      if (!album) return res.status(404).json({ code: 404, message: "Album not found" });
      return res.status(200).json(album.toJSON());
    } catch (e) {
      return next(e);
    }
  }

  async addPhoto(req, res, next) {
    try {
      const { id } = req.validated.params;
      const { url } = req.validated.body;

      const album = await this.Album.findById(id);
      if (!album) return res.status(404).json({ code: 404, message: "Album not found" });

      album.photos.push({ url, postedBy: req.auth.sub, comments: [] });
      await album.save();

      return res.status(201).json(album.toJSON());
    } catch (e) {
      return next(e);
    }
  }

  async comment(req, res, next) {
    try {
      const { id, photoId } = req.validated.params;
      const { text } = req.validated.body;

      const album = await this.Album.findById(id);
      if (!album) return res.status(404).json({ code: 404, message: "Album not found" });

      const photo = album.photos.id(photoId);
      if (!photo) return res.status(404).json({ code: 404, message: "Photo not found" });

      photo.comments.push({ author: req.auth.sub, text });
      await album.save();

      return res.status(201).json(album.toJSON());
    } catch (e) {
      return next(e);
    }
  }
}
