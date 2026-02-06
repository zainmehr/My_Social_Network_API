import { z } from "zod";
import config from "../config.mjs";
import { validate } from "../middlewares/validate.mjs";
import { requireAuth } from "../middlewares/auth.mjs";
import EventSchema from "../models/event.mjs";
import { TicketTypeSchema, TicketSchema } from "../models/ticket.mjs";


const createTicketTypeSchema = z.object({
  body: z.object({
    event: z.string().min(1),
    name: z.string().min(1),
    amount: z.number().nonnegative(),
    quantity: z.number().int().nonnegative()
  })
});

const buyTicketSchema = z.object({
  body: z.object({
    event: z.string().min(1),
    ticketType: z.string().min(1),
    buyer: z.object({
      firstname: z.string().min(1),
      lastname: z.string().min(1),
      address: z.string().min(5)
    })
  })
});

export default class Tickets {
  constructor(app, connect) {
    this.app = app;
    this.connect = connect;

    
    this.TicketType = connect.model("TicketType", TicketTypeSchema);
    this.Ticket = connect.model("Ticket", TicketSchema);
    this.Event = connect.model("Event", EventSchema);

    this.run();
  }

  run() {
    // Créer un type de billet (organisateur uniquement -> auth + contrôle dans handler)
    this.app.post(
      `${config.api.prefix}/tickets/types`,
      requireAuth,
      validate(createTicketTypeSchema),
      (req, res, next) => this.createType(req, res, next)
    );

    // Acheter (pas besoin d’être connecté dans le sujet : “personne extérieure”)
    this.app.post(`${config.api.prefix}/tickets/buy`, validate(buyTicketSchema), (req, res, next) =>
      this.buy(req, res, next)
    );
  }

  async createType(req, res, next) {
    try {
      const { event, name, amount, quantity } = req.validated.body;
      const userId = req.auth.sub;

      const ev = await this.Event.findById(event);
      if (!ev) return res.status(404).json({ code: 404, message: "Event not found" });

      if (ev.visibility !== "public" || !ev.ticketingEnabled) {
        return res.status(409).json({ code: 409, message: "Ticketing not enabled for this event" });
      }

      if (!ev.organisers.map(String).includes(userId)) {
        return res.status(403).json({ code: 403, message: "Only organisers can create ticket types" });
      }

      const tt = await this.TicketType.create({ event, name, amount, quantity });
      return res.status(201).json(tt.toJSON());
    } catch (e) {
      return next(e);
    }
  }

  async buy(req, res, next) {
    try {
      const { event, ticketType, buyer } = req.validated.body;

      const ev = await this.Event.findById(event);
      if (!ev) return res.status(404).json({ code: 404, message: "Event not found" });

      if (ev.visibility !== "public" || !ev.ticketingEnabled) {
        return res.status(409).json({ code: 409, message: "Ticketing not enabled for this event" });
      }

      const type = await this.TicketType.findById(ticketType);
      if (!type || type.event.toString() !== event) {
        return res.status(400).json({ code: 400, message: "Invalid ticketType for this event" });
      }

      // Vérifier stock
      const sold = await this.Ticket.countDocuments({ ticketType });
      if (sold >= type.quantity) {
        return res.status(409).json({ code: 409, message: "Sold out" });
      }

      // 1 seul billet par personne extérieure (index unique fait foi)
      const ticket = await this.Ticket.create({ event, ticketType, buyer });

      return res.status(201).json(ticket.toJSON());
    } catch (e) {
      return next(e);
    }
  }
}
