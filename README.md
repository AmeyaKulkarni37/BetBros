# social-betting-app

### Security Summary

The RLS policies ensure:

1. **Wagers Security**:

   - Users can only view and create their own wagers
   - Users can only bet on props in parties they're members of
   - Party hosts can view and update wagers in their parties (for resolution)
   - Prevents unauthorized access to betting data

2. **Data Isolation**:

   - Users only see parties they're members of
   - Betting data is restricted to party participants
   - Profile data is appropriately shared

3. **Authorization Levels**:

   - Regular users: Can view/create own data
   - Party hosts: Additional permissions for their parties
   - System maintains data integrity across relationships

4. **Betting Integrity**:
   - Users can't bet on parties they don't belong to
   - Wager amounts are validated against user balances
   - Only authorized users can resolve bets
