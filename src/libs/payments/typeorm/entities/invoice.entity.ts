import { EntitySchema } from "typeorm";
import { PaymentStatus } from "../../lib";
import { Invoice } from "../../../user-directory/classes/models";

export const InvoiceEntity = new EntitySchema<Invoice>({
    name: 'invoice',
    columns: {
        id: {
            type: Number,
            generated: 'increment'
        },
        createDate: {
            type: 'date',
            default: 'CURRENT_TIMESTAMP',
            nullable: false
        },
        payPrice: {
            type: Number,
        },
        description: {
            type: String
        },
        paymentStatus: {
            type: 'enum',
            enum: PaymentStatus
        }
    },
    relations: {
        plan: {
            type: 'one-to-many',
            eager: true,
            target: 'plan'
        },
        user: {
            type: 'many-to-one',
            target: 'user',
            eager: true,
            nullable: false,
            inverseSide: 'invoices'
        }
    }
})