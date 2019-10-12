import { IEntity } from "./interfaces/entity.interface";
import { IToken, TokenType } from "../../interfaces/token.interface";
import { User } from "./user.entity";
import { Entity, PrimaryGeneratedColumn, ManyToOne, Column } from "typeorm";

@Entity()
export class Token implements IEntity , IToken {
    @PrimaryGeneratedColumn()
    id: number;
    @ManyToOne(type => User, user => user.tokens)
    user: User;
    @Column()
    type: TokenType;
    @Column()
    value: string;
}