// Supabase Client Initialization
class SupabaseClient {
    constructor() {
        this.client = null;
        this.initialize();
    }
    
    initialize() {
        try {
            const { createClient } = window.supabase;
            this.client = createClient(
                GB_CONFIG.SUPABASE_URL,
                GB_CONFIG.SUPABASE_ANON_KEY
            );
            console.log('Supabase client initialized');
        } catch (error) {
            console.error('Failed to initialize Supabase:', error);
        }
    }
    
    // Auth Methods
    async signUp(email, password, metadata = {}) {
        return await this.client.auth.signUp({
            email,
            password,
            options: {
                data: metadata
            }
        });
    }
    
    async signIn(email, password) {
        return await this.client.auth.signInWithPassword({
            email,
            password
        });
    }
    
    async signOut() {
        return await this.client.auth.signOut();
    }
    
    async getSession() {
        return await this.client.auth.getSession();
    }
    
    async getUser() {
        return await this.client.auth.getUser();
    }
    
    // Database Methods
    async insert(table, data) {
        return await this.client
            .from(table)
            .insert(data)
            .select();
    }
    
    async update(table, data, match) {
        return await this.client
            .from(table)
            .update(data)
            .match(match)
            .select();
    }
    
    async delete(table, match) {
        return await this.client
            .from(table)
            .delete()
            .match(match);
    }
    
    async select(table, columns = '*', options = {}) {
        let query = this.client
            .from(table)
            .select(columns);
        
        if (options.filters) {
            options.filters.forEach(filter => {
                query = query.filter(filter.column, filter.operator, filter.value);
            });
        }
        
        if (options.orderBy) {
            query = query.order(options.orderBy.column, {
                ascending: options.orderBy.ascending
            });
        }
        
        if (options.limit) {
            query = query.limit(options.limit);
        }
        
        return await query;
    }
    
    // Realtime Subscription
    subscribeToTable(table, callback) {
        return this.client
            .channel(`public:${table}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: table
            }, callback)
            .subscribe();
    }
}

// Create global instance
const gbSupabase = new SupabaseClient();
