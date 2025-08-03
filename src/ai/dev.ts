import { config } from 'dotenv';
config();

// This will register all flows defined in this file
import '@/ai/flows/suggest-reorder-quantities.ts';
